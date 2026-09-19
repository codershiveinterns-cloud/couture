import type { Metadata } from 'next';
import AccountProfile from '@/components/account/AccountProfile';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your Couture profile and password.',
};

export default function ProfilePage() {
  return <AccountProfile />;
}
