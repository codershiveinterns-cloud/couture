import type { ReactNode } from 'react';

export interface AdminNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** true = only active on an exact path match (the dashboard). */
  exact?: boolean;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {children}
    </svg>
  );
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', exact: true, icon: <Icon><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></Icon> },
      { href: '/admin/analytics', label: 'Analytics', icon: <Icon><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Icon> },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: <Icon><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" /><circle cx="7.5" cy="7.5" r="1.2" /></Icon> },
      { href: '/admin/categories', label: 'Categories', icon: <Icon><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></Icon> },
      { href: '/admin/inventory', label: 'Inventory', icon: <Icon><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></Icon> },
    ],
  },
  {
    title: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: <Icon><path d="M6 2h12l2 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6l2-4z" /><path d="M4 6h16M9 10a3 3 0 006 0" /></Icon> },
      { href: '/admin/payments', label: 'Payments', icon: <Icon><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></Icon> },
      { href: '/admin/coupons', label: 'Coupons', icon: <Icon><path d="M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3a3 3 0 000 6v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a3 3 0 000-6z" /><path d="M14 9l-4 6M10 9.5h.01M14 14.5h.01" /></Icon> },
    ],
  },
  {
    title: 'People',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: <Icon><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.6a3.5 3.5 0 010 6.8M18 14.2a6.5 6.5 0 013.5 5.8" /></Icon> },
      { href: '/admin/reviews', label: 'Reviews', icon: <Icon><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z" /></Icon> },
    ],
  },
];

export function isNavItemActive(item: AdminNavItem, pathname: string): boolean {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
