import type { Metadata } from 'next';
import AddressesManager from '@/components/account/AddressesManager';

export const metadata: Metadata = {
  title: 'Addresses',
  description: 'Manage your saved shipping addresses.',
};

export default function AddressesPage() {
  return <AddressesManager />;
}
