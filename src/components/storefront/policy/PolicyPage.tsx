import Link from 'next/link';
import type { ReactNode } from 'react';
import { breadcrumbJsonLd, serializeJsonLd, type JsonLd } from '@/lib/seo';
import { PolicyNav } from './PolicyNav';

/**
 * Shared shell for the customer-service / legal pages (/terms, /privacy, /shipping,
 * /cancellation, /returns, /faq, /about, /contact).
 *
 * Renders the eyebrow + h1 hero, a BreadcrumbList (plus any extra JSON-LD), an "On this page"
 * mini table of contents on large screens (built from the `sections` ids) and the policy strip
 * that cross-links the policy pages. Content is plain React; use the small typography helpers
 * exported below (`PolicySection`, `PolicyP`, `PolicyList`, `PolicyCallout`) so every page
 * shares one visual rhythm.
 */

export interface PolicySectionLink {
  id: string;
  title: string;
}

export interface PolicyPageProps {
  eyebrow?: string;
  title: string;
  /** Short line under the title, e.g. "Last updated: 1 October 2026". */
  subtitle?: ReactNode;
  /** Path of this page, used for the BreadcrumbList. */
  path: string;
  /** Sections for the "On this page" TOC. Omit to hide the TOC. */
  sections?: readonly PolicySectionLink[];
  /** Additional JSON-LD objects to emit alongside the breadcrumb (e.g. FAQPage). */
  jsonLd?: readonly JsonLd[];
  /** Hide the policy strip (e.g. on /about and /contact). */
  hideNav?: boolean;
  /** Use the full width instead of max-w-3xl content (contact / about layouts). */
  wide?: boolean;
  children: ReactNode;
}

export function PolicyPage({ eyebrow = 'Customer service', title, subtitle, path, sections, jsonLd = [], hideNav, wide, children }: PolicyPageProps) {
  const data = serializeJsonLd([breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: title, path }]), ...jsonLd]);
  const showToc = !!sections && sections.length > 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: data }} />

      <header className="max-w-2xl">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink-3">{eyebrow}</p>
        <h1 className="mt-1 text-[24px] font-bold text-ink sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-2 text-[14px] text-ink-2">{subtitle}</p>}
      </header>

      {!hideNav && <PolicyNav current={path} />}

      <div className={`mt-8 ${showToc ? 'grid gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start' : ''}`}>
        <div className={wide ? 'min-w-0' : 'min-w-0 max-w-3xl'}>{children}</div>

        {showToc && (
          <nav aria-labelledby="policy-toc-heading" className="hidden lg:sticky lg:top-28 lg:block">
            <p id="policy-toc-heading" className="text-[12px] font-bold uppercase tracking-wide text-ink-3">
              On this page
            </p>
            <ol className="mt-3 flex flex-col gap-1.5 border-l border-line">
              {sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="-ml-px block border-l-2 border-transparent py-0.5 pl-3 text-[13px] text-ink-2 transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Typography helpers
 * -------------------------------------------------------------------------- */

export function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
      <h2 id={`${id}-heading`} className="mt-10 text-[18px] font-bold text-ink first:mt-0">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function PolicyP({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-ink-2">{children}</p>;
}

export function PolicyList({ items, ordered }: { items: readonly ReactNode[]; ordered?: boolean }) {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`flex flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-ink-2 ${ordered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((item, i) => (
        <li key={i} className="pl-1 marker:text-ink-4">
          {item}
        </li>
      ))}
    </Tag>
  );
}

export function PolicyCallout({ title, children, tone = 'neutral' }: { title?: string; children: ReactNode; tone?: 'neutral' | 'brand' }) {
  const toneClass = tone === 'brand' ? 'border-brand/30 bg-brand-light' : 'border-line bg-surface';
  return (
    <div className={`rounded-sm border border-l-[3px] px-4 py-3.5 ${toneClass} ${tone === 'brand' ? 'border-l-brand' : 'border-l-ink-4'}`}>
      {title && <p className="text-[12px] font-bold uppercase tracking-wide text-ink">{title}</p>}
      <div className={`${title ? 'mt-1.5' : ''} text-[14px] leading-relaxed text-ink-2`}>{children}</div>
    </div>
  );
}

/** Inline brand-coloured link used inside policy copy. */
export function PolicyLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-bold text-brand underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink">
      {children}
    </Link>
  );
}

/** Two-column definition list (e.g. refund timelines by payment method). */
export function PolicyTable({ caption, rows }: { caption: string; rows: readonly { label: string; value: ReactNode }[] }) {
  return (
    <table className="w-full border-collapse text-[14px]">
      <caption className="sr-only">{caption}</caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-line last:border-b-0">
            <th scope="row" className="w-2/5 py-2.5 pr-4 text-left align-top font-bold text-ink">
              {row.label}
            </th>
            <td className="py-2.5 align-top leading-relaxed text-ink-2">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PolicyPage;
