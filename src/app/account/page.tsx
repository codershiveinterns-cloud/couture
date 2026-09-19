import type { Metadata } from 'next';
import AccountOverview from '@/components/account/AccountOverview';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Your Couture orders, addresses, wishlist and profile at a glance.',
};

export default function AccountPage() {
  return <AccountOverview />;
}
