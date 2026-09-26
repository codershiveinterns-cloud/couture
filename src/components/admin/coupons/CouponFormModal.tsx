'use client';

import { useState, type FormEvent } from 'react';
import { Button, Checkbox, Input, Modal, Select, Textarea } from '@/components/ui';
import { toast } from '@/context/ToastContext';
import type { Coupon } from '@/lib/coupons';
import {
  couponToInput,
  createCoupon,
  EMPTY_COUPON_INPUT,
  updateCoupon,
  validateCouponInput,
  type CouponField,
  type CouponInput,
} from '@/lib/services/coupons';
import type { FieldErrors } from '@/lib/validation';

interface FormState {
  code: string;
  description: string;
  type: CouponInput['type'];
  value: string;
  minOrder: string;
  maxDiscount: string;
  expiresAt: string;
  usageLimit: string;
  active: boolean;
}

const numberText = (value: number | null) => (value === null ? '' : String(value));

function toFormState(input: CouponInput): FormState {
  return {
    code: input.code,
    description: input.description,
    type: input.type,
    value: numberText(input.value),
    minOrder: numberText(input.minOrder),
    maxDiscount: numberText(input.maxDiscount),
    // Stored expiry is end-of-day UTC, so the date part round-trips through <input type="date">.
    expiresAt: input.expiresAt ? input.expiresAt.slice(0, 10) : '',
    usageLimit: numberText(input.usageLimit),
    active: input.active,
  };
}

/** '' → fallback; otherwise Number(text) (NaN is caught by the service validation). */
const parseNumber = (text: string) => (text.trim() === '' ? Number.NaN : Number(text));
const parseOptional = (text: string) => (text.trim() === '' ? null : Number(text));

function toInput(form: FormState): CouponInput {
  return {
    code: form.code.trim().toUpperCase(),
    description: form.description,
    type: form.type,
    value: parseNumber(form.value),
    minOrder: form.minOrder.trim() === '' ? 0 : Number(form.minOrder),
    maxDiscount: form.type === 'percentage' ? parseOptional(form.maxDiscount) : null,
    expiresAt: form.expiresAt || null,
    usageLimit: parseOptional(form.usageLimit),
    active: form.active,
  };
}

const TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'fixed', label: 'Fixed amount ($)' },
];

/** Mount with a fresh `key` per open so the form state resets. `coupon` = null ⇒ create. */
export function CouponFormModal({ coupon, onClose }: { coupon: Coupon | null; onClose(): void }) {
  const [form, setForm] = useState<FormState>(() => toFormState(coupon ? couponToInput(coupon) : EMPTY_COUPON_INPUT));
  const [errors, setErrors] = useState<FieldErrors<CouponField>>({});

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const input = toInput(form);
    const fieldErrors = validateCouponInput(input, coupon?.code ?? null);
    if (Object.values(fieldErrors).some(Boolean)) {
      setErrors(fieldErrors);
      return;
    }
    const result = coupon ? updateCoupon(coupon.code, input) : createCoupon(input);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    toast.success(coupon ? `Coupon ${result.data.code} updated` : `Coupon ${result.data.code} created`);
    onClose();
  };

  const formId = 'coupon-form';
  const isPercentage = form.type === 'percentage';

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={coupon ? `Edit ${coupon.code}` : 'Create coupon'}
      description={coupon ? `Redeemed ${coupon.usedCount} time${coupon.usedCount === 1 ? '' : 's'} so far.` : undefined}
      closeOnOutsideClick={false}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId}>
            {coupon ? 'Save changes' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Code"
          required
          value={form.code}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => update('code', event.target.value.toUpperCase().replace(/\s+/g, ''))}
          hint="3–20 letters, numbers, dashes or underscores"
          error={errors.code}
          className="font-mono uppercase"
        />
        <Select
          label="Discount type"
          required
          value={form.type}
          onChange={(event) => update('type', event.target.value === 'fixed' ? 'fixed' : 'percentage')}
          options={TYPE_OPTIONS}
          error={errors.type}
        />
        <Input
          label={isPercentage ? 'Value (%)' : 'Value ($)'}
          required
          type="number"
          inputMode="decimal"
          min={0}
          max={isPercentage ? 100 : undefined}
          step={isPercentage ? 1 : 0.01}
          value={form.value}
          onChange={(event) => update('value', event.target.value)}
          error={errors.value}
        />
        <Input
          label="Minimum order ($)"
          type="number"
          inputMode="decimal"
          min={0}
          step={0.01}
          value={form.minOrder}
          onChange={(event) => update('minOrder', event.target.value)}
          hint={isPercentage ? '0 = no minimum' : 'Must be at least the discount amount'}
          error={errors.minOrder}
        />
        {isPercentage && (
          <Input
            label="Maximum discount ($)"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={form.maxDiscount}
            onChange={(event) => update('maxDiscount', event.target.value)}
            hint="Leave empty for no cap"
            error={errors.maxDiscount}
          />
        )}
        <Input
          label="Usage limit"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={form.usageLimit}
          onChange={(event) => update('usageLimit', event.target.value)}
          hint="Leave empty for unlimited"
          error={errors.usageLimit}
        />
        <Input
          label="Expiry date"
          type="date"
          value={form.expiresAt}
          onChange={(event) => update('expiresAt', event.target.value)}
          hint="Valid through the end of this day (UTC). Empty = never expires"
          error={errors.expiresAt}
        />
        <Textarea
          label="Description"
          rows={2}
          maxLength={140}
          showCount
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder="Leave blank to generate one automatically"
          error={errors.description}
          wrapperClassName="sm:col-span-2"
        />
        <Checkbox
          label="Active"
          description="Inactive coupons cannot be applied at checkout."
          checked={form.active}
          onChange={(event) => update('active', event.target.checked)}
          error={errors.active}
          wrapperClassName="sm:col-span-2"
        />
      </form>
    </Modal>
  );
}

export default CouponFormModal;
