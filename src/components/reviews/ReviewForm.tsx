'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from '@/context/ToastContext';
import type { Review, ServiceResult } from '@/lib/services/types';
import {
  hasErrors,
  REVIEW_BODY_MAX,
  REVIEW_BODY_MIN,
  REVIEW_TITLE_MAX,
  validateReviewInput,
  type FieldErrors,
  type ReviewInput,
} from '@/lib/validation';
import { StarInput } from './StarInput';

type ReviewErrors = FieldErrors<keyof ReviewInput>;

export interface ReviewFormProps {
  onSubmit(input: ReviewInput): Promise<ServiceResult<Review>>;
  className?: string;
}

export function ReviewForm({ onSubmit, className = '' }: ReviewFormProps) {
  const baseId = useId();
  const ratingId = `${baseId}-rating`;
  const titleId = `${baseId}-title`;
  const bodyId = `${baseId}-body`;

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const focusFirstInvalid = (fieldErrors: ReviewErrors) => {
    const first = (['rating', 'title', 'body'] as const).find((key) => fieldErrors[key]);
    if (!first) return;
    const id = first === 'rating' ? ratingId : first === 'title' ? titleId : bodyId;
    const el = document.getElementById(id);
    const target = el?.matches('[role="radiogroup"]') ? el.querySelector<HTMLElement>('[tabindex="0"]') : el;
    target?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const input: ReviewInput = { rating, title, body };
    const fieldErrors = validateReviewInput(input);
    setFormError(null);
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) {
      focusFirstInvalid(fieldErrors);
      return;
    }

    setSubmitting(true);
    const result = await onSubmit(input);
    setSubmitting(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      if (result.fieldErrors) focusFirstInvalid(result.fieldErrors);
      return;
    }
    toast.success('Thanks for your review!', { description: 'It is now live on this product.' });
    setRating(0);
    setTitle('');
    setBody('');
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={`flex flex-col gap-4 ${className}`}>
      <StarInput
        id={ratingId}
        value={rating}
        onChange={(next) => {
          setRating(next);
          if (errors.rating) setErrors((prev) => ({ ...prev, rating: undefined }));
        }}
        error={errors.rating}
        required
        disabled={submitting}
      />

      <Input
        id={titleId}
        label="Title"
        labelAddon="Optional"
        value={title}
        maxLength={REVIEW_TITLE_MAX}
        placeholder="Sum it up in a few words"
        autoComplete="off"
        error={errors.title}
        disabled={submitting}
        onChange={(e) => setTitle(e.target.value)}
      />

      <Textarea
        id={bodyId}
        label="Your review"
        required
        showCount
        value={body}
        maxLength={REVIEW_BODY_MAX}
        minLength={REVIEW_BODY_MIN}
        rows={5}
        placeholder={`What did you like or dislike? At least ${REVIEW_BODY_MIN} characters.`}
        error={errors.body}
        disabled={submitting}
        onChange={(e) => setBody(e.target.value)}
      />

      {formError && (
        <p role="alert" className="rounded-sm border border-brand/30 bg-brand-light px-3.5 py-2.5 text-[12px] font-medium text-brand">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button type="submit" loading={submitting} loadingText="Posting…" fullWidth>
          Submit review
        </Button>
        <p className="text-[12px] text-ink-3">Your name appears as first name + last initial.</p>
      </div>
    </form>
  );
}

export default ReviewForm;
