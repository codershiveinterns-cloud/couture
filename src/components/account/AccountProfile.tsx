'use client';

import { useAuth } from '@/context/AuthContext';
import { LoadingPanel } from './accountUtils';
import { ChangePasswordCard } from './ChangePasswordCard';
import { ProfileCard } from './ProfileCard';

export function AccountProfile() {
  const { user, status } = useAuth();
  if (status !== 'authenticated' || !user) return <LoadingPanel label="Loading your profile" />;

  return (
    <div className="flex flex-col gap-6">
      <ProfileCard key={user.updatedAt} user={user} />
      <ChangePasswordCard />
    </div>
  );
}

export default AccountProfile;
