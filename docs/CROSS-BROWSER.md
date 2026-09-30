# Couture — Cross-browser support

## Support matrix

| Browser | Minimum | Status | Notes |
|---|---|---|---|
| Chrome / Chromium (desktop) | 111+ | Supported | Primary development browser; everything verified here |
| Edge (desktop) | 111+ | Supported | Same engine as Chrome |
| Firefox (desktop) | 128+ | Supported | `scrollbar-width` / `scrollbar-color` are the native scrollbar styling here (the `::-webkit-scrollbar` rules are ignored) |
| Safari (macOS) | **16.4+** | Supported | Floor set by Tailwind CSS v4 (see below) |
| iOS Safari | **16.4+** | Supported | Also drives every in-app browser on iOS (Chrome, Instagram, etc., all use WebKit) |
| Android Chrome | 111+ | Supported | Touch behaviour verified through the `pointer: coarse` variant |
| Samsung Internet | 22+ | Expected to work | Chromium 111 based; not tested |
| Internet Explorer / legacy Edge | — | Not supported | React 19 and Tailwind v4 do not target them |

The floor is dictated by **Tailwind CSS v4**, which emits modern CSS (cascade layers, `@property`, `color-mix()`, nested rules) and officially supports **Safari 16.4+, Chrome 111+, Firefox 128+**. Older browsers get a page with missing styling rather than a broken app; there is no legacy build.

Verification method (see TEST-REPORT.md): executed in Chromium via the dev server and `curl`; the other browsers were reviewed against feature usage in the code base (list below), not executed on devices. Any statement below that says "reviewed" has not been run on the browser named.

## Features used and what they rely on

### CSS

| Feature | Where | Safari 16.4 | Firefox 128 | Chrome 111 | Fallback / note |
|---|---|---|---|---|---|
| Tailwind v4 output: cascade layers `@layer`, `@property`, `color-mix()` (opacity modifiers such as `bg-white/95`, `ring-brand/40`) | everywhere | Yes | Yes | Yes | None — this is the support floor |
| `aspect-ratio` (`aspect-[3/4]`, `aspect-[16/7]`, `aspect-[21/6]`) | product cards, hero, category banner, skeletons | Yes (15+) | Yes | Yes | None needed |
| `gap` in flex and grid (`gap-*`, 400 uses) | everywhere | Yes (14.1+) | Yes | Yes | None needed |
| Named grid tracks `grid-cols-[minmax(0,7fr)_minmax(0,5fr)]` etc. | PDP, admin tables | Yes | Yes | Yes | None needed |
| `position: sticky` (`sticky`, `lg:top-24`) | PDP buy box, filter sidebar, admin sidebar, save bar | Yes | Yes | Yes | Degrades to static flow |
| Scroll snap (`snap-x`, `snap-start`) | product rails, gallery carousel on mobile | Yes | Yes | Yes | Degrades to normal scrolling |
| `backdrop-filter` (`backdrop-blur-sm`) | category banner pill, drawers | Yes | Yes (103+) | Yes | Cosmetic only |
| `dvh` unit (`max-h-[92dvh]` in `Modal`) | modals / bottom sheets | Yes (15.4+) | Yes | Yes (108+) | None needed within the floor |
| `line-clamp` (`-webkit-line-clamp`) | testimonials, admin cards | Yes | Yes | Yes | Text overflows visibly otherwise |
| `scrollbar-width` / `scrollbar-color` and `::-webkit-scrollbar` | global thin scrollbars, `.no-scrollbar` rails | WebKit rules apply | Standard rules apply | Both (Chrome 121+ prefers standard) | Both syntaxes are shipped; unsupported one is ignored |
| `pointer-coarse:` variant (`@media (pointer: coarse)`) | `ProductCard` heart button on touch devices | Yes | Yes | Yes | On mouse devices the wishlist action is in the hover panel instead |
| `motion-reduce:` variant + `@media (prefers-reduced-motion: reduce)` in `globals.css` | animations, reveal, shimmer | Yes | Yes | Yes | Animations removed when the OS asks for reduced motion |
| `:focus-visible` (114 uses), `:focus-within` | every interactive control | Yes (15.4+) | Yes | Yes | None needed |
| `::selection`, CSS custom properties, `@keyframes` | theme tokens, animations | Yes | Yes | Yes | None needed |
| `:has()` | **not used** | — | — | — | Avoided deliberately (Firefox < 121 lacks it) |
| CSS nesting written by hand | **not used** in `globals.css` | — | — | — | Only Tailwind's compiled output uses nesting |
| Container queries, `text-wrap: balance`, `popover`, `<dialog>`, the `inert` attribute | not used | — | — | — | Modal is a custom implementation (JS focus trap, Escape, body scroll lock) — no dependency on `<dialog>` support |

### JavaScript / Web APIs

| Feature | Where | Notes / fallback |
|---|---|---|
| `localStorage` + `storage` event | entire demo data layer (`src/lib/storage.ts`) | Every read/write is wrapped in `try/catch`; when storage is unavailable (private mode quotas, blocked site data) values live in an in-memory map for the session, so the app still works but does not persist. SSR never touches it |
| `crypto.subtle.digest` (SHA-256 password hashing) | `src/lib/services/crypto.ts` | Available in secure contexts only (HTTPS or `localhost`). A pure-JS SHA-256 fallback is used on plain-HTTP LAN previews or when `subtle` throws, so sign-in works everywhere |
| `crypto.getRandomValues` | ids, salts, order numbers | Falls back to `Math.random` when absent (never in the supported matrix) |
| `IntersectionObserver` | `Reveal` scroll-in animation | Used unguarded (`src/components/Reveal.tsx`); available in every browser in the matrix (Safari 12.1+). Content is fully visible when reduced motion is on |
| `ResizeObserver` | admin charts (`chartUtils.ts`) | Guarded with `typeof ResizeObserver === 'undefined'` |
| `matchMedia` | `BackToTop` (reduced motion), `AdminShell` (desktop breakpoint) | Standard in all targets |
| `AbortController` | cancelling an in-flight test payment | Standard in all targets |
| `URLSearchParams`, `TextEncoder`, `Intl.NumberFormat` / `Intl.DateTimeFormat` | filters, hashing, price and date formatting | Standard in all targets; formatting uses the `en-US` locale explicitly so output is identical across browsers |
| `Blob` + object URL download | CSV export (inventory, orders) | Works in all targets; iOS Safari opens the file in a new tab rather than saving silently |
| `navigator.clipboard` | "Copy link" share action on the product page (`ProductActions.tsx`) | Requires a secure context; failure is caught silently (no "Copied" confirmation appears) |
| `requestAnimationFrame`, `window.scrollTo` with `behavior: 'smooth'` | progress bar, back-to-top | Smooth scrolling is a hint; ignored when reduced motion is on |
| Web fonts via `next/font` (Figtree, `display: swap`) | typography | Self-hosted by Next.js; falls back to the system stack listed in `globals.css` |

### Input and mobile specifics (reviewed)

- Numeric fields use `inputMode` (26 uses) and `autoComplete` (40 uses) so iOS/Android show the right keyboard and autofill address/card names; card number and expiry are formatted as you type.
- `viewport-fit: cover` is set in the viewport metadata, but no `env(safe-area-inset-*)` padding is applied yet: on notched iPhones in landscape, fixed bottom bars (mobile SORT | FILTER bar, product-page buy bar, admin save bar) can sit flush with the home indicator. Listed as an open item in TEST-REPORT.md.
- Tap targets are at least 36–44 px (`h-9` to `h-12` controls); hover-only affordances (product-card action panel) have a touch equivalent (heart on the image, product page actions).
- The single light theme (`color-scheme: light`) prevents iOS Safari from auto-darkening form controls.

## Known differences (not defects)

- Safari renders `<select>` and `type="date"` controls with its native look; the surrounding border and label styling is ours.
- Firefox does not show the `::-webkit-scrollbar` styling; it uses the thin standard scrollbar instead.
- Smooth scrolling and the reveal animation are disabled when the OS reduced-motion preference is on — by design.
- iOS in-app browsers may block `localStorage` in some privacy modes; the app then runs from memory for the session (bag and sign-in are lost when the view closes).
