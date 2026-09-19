import type { Metadata } from 'next';
import WishlistView from '@/components/wishlist/WishlistView';

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Products you have saved for later on Couture.',
};

export default function WishlistPage() {
  return <WishlistView />;
}
