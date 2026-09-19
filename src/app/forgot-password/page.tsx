import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Request a link to reset your Couture password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
