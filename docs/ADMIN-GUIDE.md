# Couture — Admin guide

The back office lives at **`/admin`**. Sign in at **`/admin/login`** with the demo administrator **admin@couture.test / Admin@12345** (a "Fill demo credentials" button is on the sign-in card). Only accounts with the `admin` role get in: guests are redirected to the sign-in page (and back to where they were afterwards), and customers who are signed in see a "You don't have access to the admin area" panel.

Everything in this build is stored in the browser you are using (see HANDOVER.md, "Known limitations"). Use the same browser to see the same data, and expect the storefront in that browser to reflect your edits immediately.

## Layout

- **Sidebar** — Overview (Dashboard, Analytics), Catalog (Products, Categories, Inventory), Sales (Orders, Payments, Coupons), People (Customers, Reviews) and, when present, Notifications. The Orders item shows a red badge with the number of open orders. The sidebar footer shows who is signed in, with **View store** and **Log out**.
- **Header** — a "Pending orders" shortcut with a count, and **View store ↗** (opens the storefront in a new tab). Below 1024 px the sidebar becomes a slide-in drawer opened from the hamburger button (closes with Escape, the X, the backdrop or by choosing a page).
- Every list has a search box, filters and — where the list can grow — 10 rows per page with Previous / Next. Destructive actions always ask for confirmation. Success and failure are reported by toasts in the corner.

## Dashboard (`/admin`)

Eight KPI tiles (Total sales, Orders, Customers, Products, Pending orders, Completed orders, Average order value, Low-stock items — most link to the matching screen), a 14-day revenue/orders chart, payment-method donut, recent orders, low-stock products, best sellers and recent customers.

- **Demo activity** is seeded automatically the first time the dashboard opens with zero orders: four demo customers, 18 orders over the last 14 days with payments, tracking, coupons and a mix of statuses. Inventory is not reduced by these historic orders.
- **Reset demo data** (header button) erases every order, payment, customer, coupon change, review and catalog edit stored in this browser and signs you out. The admin account and demo activity are recreated on the next sign-in. Confirm with **Reset everything**; **Keep data** cancels.
- **Add product** jumps to the product editor.

## Analytics (`/admin/analytics`)

Choose **7 / 14 / 30 days** in the header; every panel follows that period: revenue and orders KPIs (with a first-half vs second-half trend), average order value for the period (the all-time value is in the caption), the revenue & orders chart, best-selling products (top 10 by units), payment-method revenue split, sales by category and the order-status breakdown. Cancelled and refunded orders never count as revenue. The screen is read-only.

## Products (`/admin/products`)

- **Find things:** search by name, SKU, brand or variant SKU; filter by category, status (Published / Draft) and stock (In / Low / Out); sort by newest, name, price or stock.
- **Row actions:** Edit, Publish / Unpublish, View in store (published base-catalog products), Delete (confirmation). The star in the Featured column toggles the "featured" flag used by the home page rails.
- **Bulk actions:** tick rows (the header checkbox selects the page) to Publish, Unpublish or Delete them together.
- Deleting a product removes it from the catalog and from shoppers' bags and wishlists; past orders keep their own copy of the line.

### Product editor (`/admin/products/new`, `/admin/products/[id]`)

New products start as **drafts**; the submit button reads *Create draft / Create & publish / Save draft / Save & publish* depending on the status you choose. Validation problems are listed at the top and next to each field.

| Section | Rules |
|---|---|
| Basic info | Name 3–120 characters; brand up to 60; category required; short description up to 200 (shown on cards); description required, up to 4000 |
| Images | Up to 8 URLs from `https://images.unsplash.com/` only, each with alt text; reorder with the arrows — the first image is the primary one; **at least one image is required to publish** |
| Pricing | Selling price > 0; optional MRP / compare-at price must be higher than the selling price — the live preview shows the "% OFF" shoppers will see |
| Inventory | SKU required, 2–40 characters (`A–Z 0–9 . _ -`, upper-cased automatically), unique across all products and variants; stock is a whole number ≥ 0 |
| Variations | Optional, up to 30. Give the option a name (e.g. Color, Size) and add rows with a value, SKU (suggested as `SKU-V1`, must be unique), stock, price difference (the resulting price must stay above 0) and an Active switch. With variations, product stock is read-only and equals the sum of active variant stock |
| Status | Published or Draft (drafts are hidden from shoppers and removed from bags); Featured checkbox |

Slugs (the product URL) are generated from the name, kept unique and stay stable when you rename a product.

## Categories (`/admin/categories`)

Table of categories with slug, description, published product count (links to the filtered product list) and draft count. **Add category / Edit** open a modal: name 2–60 characters and unique; slug generated from the name (editing it changes the category URL); description up to 300; optional Unsplash image with preview. **Delete** is refused while the category still has products — move or delete them first.

## Inventory (`/admin/inventory`)

Tiles for total SKUs, units on hand, low stock (≤ 5 units) and out of stock. Filter All / Low stock / Out of stock and search by product, SKU or variant. Products with variations appear as a parent row (total) followed by one row per variant.

- Change the stepper and press **Update**, or press **Restock +10**. For products with variations, update each variant row (the parent row is read-only).
- **Export CSV** downloads the rows currently shown as `couture-inventory-YYYY-MM-DD.csv`.
- Stock is also moved automatically: decremented when an order is paid or placed with COD, restored when an order is cancelled.

## Orders (`/admin/orders`)

Status tabs with counts (All, Placed, Confirmed, Processing, Shipped, Out for delivery, Delivered, Cancelled, Refunded), search by order number / customer name / email, filters for payment status, payment method and date range (7 / 30 days), sortable columns and **Export CSV** (`couture-orders-YYYY-MM-DD.csv`, the filtered list, spreadsheet-formula-safe). **View** opens the order.

### Order detail (`/admin/orders/[orderNumber]`)

Status flow: **Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered**, plus **Cancelled** and **Refunded**. Customers see the same timeline on their order page immediately.

| Action | When it is available | Effect |
|---|---|---|
| **Update status** | Any later step of the flow (steps can be skipped, never reversed); optional note up to 200 characters shown on the timeline | Moves the order forward. A COD order that reaches Delivered is marked Paid automatically |
| **Tracking** | While the order is open (before Delivered / Cancelled / Refunded) | Carrier (FedEx, UPS, USPS, DHL, Blue Dart, Delhivery or Other with a free-text name) + tracking number (6–40 letters, digits, dashes). Saving tracking does *not* change the status — move it to Shipped yourself |
| **Cancel order** | Before Shipped | Items return to stock; a pending payment becomes Cancelled; a paid payment stays Paid until refunded. Optional reason is shown to the customer |
| **Process refund** | Cancelled or Delivered orders whose payment is Paid | Order and payment become Refunded |
| **Mark COD collected** | Cash-on-delivery orders whose payment is Pending | Payment becomes Paid |

The page also shows the items with totals, the full status timeline with notes, customer (link to profile), shipping address and the payment record (method, instrument such as "Visa •••• 4242", gateway reference, failure reason).

## Payments (`/admin/payments`)

Read-only ledger of **every payment attempt**, including failed and cancelled ones (they show "No order created"). Tiles for collected, pending COD, failed and refunded amounts; search by reference, order number or customer; filter by status and method. Only the card brand and last four digits (or a masked UPI id) are ever stored. Payment state changes are made from the order page (COD collected, refund, cancel).

## Coupons (`/admin/coupons`)

Tiles for active, expired and total redemptions; search and a status filter (Active / Inactive / Expired / Limit reached). Each row shows the discount, minimum order, maximum discount, expiry, usage (used / limit) and an **Active** switch that toggles inline. **Add / Edit** open a modal:

- Code 3–20 characters (`A–Z 0–9 - _`, upper-cased), unique.
- Type Percentage (1–100 %, optional maximum discount) or Fixed amount (minimum order must be at least the discount).
- Minimum order ≥ 0; optional usage limit (whole number ≥ 1); optional expiry date (valid through the end of that day); description (auto-generated when blank).

Coupons are evaluated live in the bag: deactivating, expiring or exhausting a coupon removes it from shoppers' bags with a message. **Delete** asks for confirmation; prefer switching a coupon off so past orders keep their reference.

## Customers (`/admin/customers`)

Search by name, email or phone; filter Active / Blocked; sort by registration, spend, order count, last order or name. Columns: customer, phone, registered, orders, total spent (cancelled/refunded excluded), last order, status.

### Customer detail (`/admin/customers/[id]`)

Profile, saved addresses (default marked), spend tiles and the order history. **Block customer** signs the customer out immediately and prevents further sign-ins ("This account has been suspended"); **Unblock** restores access. Data is never deleted. Admin accounts cannot be blocked.

## Reviews (`/admin/reviews`)

Tiles for all / customer-written / hidden reviews and the average rating. Filter by status (Published / Hidden), rating, source (Customer / Seeded demo) and product name. Each card shows the stars, product link, title, text, author and date.

- **Hide** removes a review from the storefront and from the product's rating; **Publish** restores it. A customer whose review is hidden cannot post a second one.
- **Delete** is permanent (confirmation modal).

## Notifications (`/admin/notifications`, when present)

Transactional notifications (registration, order confirmation, payment received / failed, status updates, shipped, delivered, cancelled, refunded) are recorded twice: as an in-app notification for the customer (bell in the storefront header, `/account/notifications`) and as an **email in the outbox** with the rendered subject and body. There is no email provider connected yet, so outbox entries are "delivered" by the console transport or remain **Queued**; a retry action re-attempts delivery through the active transport. Connecting a real provider is described in DEPLOYMENT.md.

## Everyday recipes

- **Launch a product:** Products → Add product → fill in details, at least one Unsplash image, price and SKU → *Create & publish*. It appears on the storefront (search, category, home rails if featured) at once.
- **Run a promotion:** Coupons → Add coupon (e.g. `SALE20`, percentage 20, max discount $30, expiry) → Active. Share the code; watch "used" climb.
- **Fulfil an order:** Orders → open the order → Update status to Confirmed / Processing → add carrier + tracking → set Shipped → Out for Delivery → Delivered (COD orders become Paid at delivery). The customer's order page shows each step.
- **Handle a return:** if not yet shipped, Cancel order (stock is restored). For paid, delivered orders, Process refund.
- **Start over for a demo:** Dashboard → Reset demo data → sign in again; the sample activity is recreated.
