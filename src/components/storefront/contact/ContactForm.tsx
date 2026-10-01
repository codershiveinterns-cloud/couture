'use client';

import { useState, type FormEvent } from 'react';
import { toast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

/**
 * Contact form.
 *
 * NOTE: there is no backend for support messages in this build. Submitting validates locally,
 * shows a success state and a toast, and discards the message. Wire `onSubmit` to a
 * `/api/contact` route (or a helpdesk provider) when one exists.
 */

const TOPICS = [
  { value: 'order', label: 'Order' },
  { value: 'returns', label: 'Returns' },
  { value: 'payment', label: 'Payment' },
  { value: 'product', label: 'Product question' },
  { value: 'other', label: 'Other' },
] as const;

const MESSAGE_MAX = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORDER_RE = /^(CTR-)?[A-Z0-9-]{4,20}$/i;

interface FormState {
  name: string;
  email: string;
  orderNumber: string;
  topic: string;
  message: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = { name: '', email: '', orderNumber: '', topic: '', message: '' };

function validate(form: FormState): Errors {
  const errors: Errors = {};
  if (!form.name.trim()) errors.name = 'Enter your name';
  if (!form.email.trim()) errors.email = 'Enter your email address';
  else if (!EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if (form.orderNumber.trim() && !ORDER_RE.test(form.orderNumber.trim())) errors.orderNumber = 'That does not look like a Couture order number';
  if (!form.topic) errors.topic = 'Choose a topic';
  if (!form.message.trim()) errors.message = 'Tell us how we can help';
  else if (form.message.trim().length < 10) errors.message = 'Please add a little more detail (at least 10 characters)';
  return errors;
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const update = (key: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstId = `contact-${Object.keys(next)[0]}`;
      document.getElementById(firstId)?.focus();
      return;
    }
    // No backend: see the note at the top of this file.
    setSent(true);
    toast.success('Message sent', { description: "We'll reply within 1 business day." });
  };

  if (sent) {
    return (
      <div role="status" className="animate-fade-in rounded-sm border border-line bg-white p-6 sm:p-8">
        <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-success">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        <h2 className="mt-4 text-[20px] font-bold text-ink">Thanks, we&rsquo;ll reply within 1 business day</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
          We&rsquo;ve received your message about <span className="font-bold text-ink">{TOPICS.find((t) => t.value === form.topic)?.label.toLowerCase()}</span>{' '}
          and will get back to you at <span className="font-bold text-ink">{form.email.trim()}</span>.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-6"
          onClick={() => {
            setForm(EMPTY);
            setErrors({});
            setSent(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-sm border border-line bg-white p-5 sm:p-6">
      <h2 className="text-[18px] font-bold text-ink">Send us a message</h2>
      <p className="mt-1 text-[13px] text-ink-3">Fields marked * are required.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Input
          id="contact-name"
          label="Name"
          required
          autoComplete="name"
          value={form.name}
          error={errors.name}
          onChange={update('name')}
          placeholder="Your full name"
        />
        <Input
          id="contact-email"
          type="email"
          label="Email"
          required
          autoComplete="email"
          inputMode="email"
          value={form.email}
          error={errors.email}
          onChange={update('email')}
          placeholder="you@example.com"
        />
        <Input
          id="contact-orderNumber"
          label="Order number"
          hint="Optional — starts with CTR-"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={form.orderNumber}
          error={errors.orderNumber}
          onChange={update('orderNumber')}
          placeholder="CTR-XXXXXXXX"
          className="uppercase"
        />
        <Select
          id="contact-topic"
          label="Topic"
          required
          placeholder="Choose a topic"
          options={TOPICS}
          value={form.topic}
          error={errors.topic}
          onChange={update('topic')}
        />
        <Textarea
          id="contact-message"
          label="Message"
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          showCount
          value={form.message}
          error={errors.message}
          onChange={update('message')}
          placeholder="Tell us what happened and how we can help."
          wrapperClassName="sm:col-span-2"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-relaxed text-ink-3">
          We use your details only to reply to this message. See our privacy policy for how we handle your data.
        </p>
        <Button type="submit" size="md" className="sm:shrink-0">
          Send message
        </Button>
      </div>
    </form>
  );
}

export default ContactForm;
