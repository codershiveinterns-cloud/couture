import { AuthCard } from '@/components/auth/AuthCard';
import { Spinner } from '@/components/ui/Spinner';

export function AuthPageFallback({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <AuthCard eyebrow={eyebrow} title={title}>
      <div className="flex items-center justify-center py-8 text-ink-4">
        <Spinner size="lg" />
      </div>
    </AuthCard>
  );
}

export default AuthPageFallback;
