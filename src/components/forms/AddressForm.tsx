'use client';

import { useId, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { ServiceResult } from '@/lib/services/types';
import {
  COUNTRIES,
  EMPTY_ADDRESS_INPUT,
  hasErrors,
  validateAddressInput,
  type AddressField,
  type AddressInput,
  type FieldErrors,
} from '@/lib/validation';

export interface AddressFormProps {
  initialValues?: Partial<AddressInput>;
  submitLabel?: string;
  cancelLabel?: string;
  /** Return the service result so field errors / the form error are shown; resolve void on success. */
  onSubmit(input: AddressInput): Promise<ServiceResult<unknown> | void> | ServiceResult<unknown> | void;
  onCancel?(): void;
  /** Renders the "Set as default address" checkbox (default true). */
  showDefaultToggle?: boolean;
  /** Disables + locks the checkbox on (e.g. editing the current default). */
  defaultLocked?: boolean;
  /** Autofocus the first field (e.g. inside a modal). */
  autoFocus?: boolean;
  className?: string;
  id?: string;
}

const FIELD_ORDER: readonly AddressField[] = ['fullName', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'];

export function AddressForm({
  initialValues,
  submitLabel = 'Save address',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel,
  showDefaultToggle = true,
  defaultLocked = false,
  autoFocus = false,
  className = '',
  id: idProp,
}: AddressFormProps) {
  const generatedId = useId();
  const formId = idProp ?? generatedId;
  const [values, setValues] = useState<AddressInput>({ ...EMPTY_ADDRESS_INPUT, ...initialValues });
  const [errors, setErrors] = useState<FieldErrors<AddressField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldId = (field: keyof AddressInput) => `${formId}-${field}`;

  const setField = <K extends keyof AddressInput>(field: K, value: AddressInput[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (field !== 'isDefault' && errors[field as AddressField]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (formError) setFormError(null);
  };

  const focusFirstInvalid = (fieldErrors: FieldErrors<AddressField>) => {
    const first = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (first) document.getElementById(fieldId(first))?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const input: AddressInput = { ...values, isDefault: defaultLocked ? true : values.isDefault };
    const validation = validateAddressInput(input);
    if (hasErrors(validation)) {
      setErrors(validation);
      setFormError(null);
      focusFirstInvalid(validation);
      return;
    }

    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      const result = await onSubmit(input);
      if (result && !result.ok) {
        const fieldErrors = (result.fieldErrors ?? {}) as FieldErrors<AddressField>;
        setErrors(fieldErrors);
        setFormError(hasErrors(fieldErrors) ? null : result.error);
        if (hasErrors(fieldErrors)) focusFirstInvalid(fieldErrors);
      }
    } catch {
      setFormError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className={`flex flex-col gap-4 ${className}`}>
      {formError && (
        <p role="alert" className="rounded-sm bg-brand-light px-4 py-3 text-[13px] font-medium text-brand">
          {formError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={fieldId('fullName')}
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          autoFocus={autoFocus}
          value={values.fullName}
          error={errors.fullName}
          onChange={(e) => setField('fullName', e.target.value)}
        />
        <Input
          id={fieldId('phone')}
          label="Phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          required
          value={values.phone}
          error={errors.phone}
          onChange={(e) => setField('phone', e.target.value)}
        />
      </div>

      <Input
        id={fieldId('line1')}
        label="Address line 1"
        name="line1"
        autoComplete="address-line1"
        placeholder="Street address, P.O. box"
        required
        value={values.line1}
        error={errors.line1}
        onChange={(e) => setField('line1', e.target.value)}
      />
      <Input
        id={fieldId('line2')}
        label="Address line 2"
        labelAddon="Optional"
        name="line2"
        autoComplete="address-line2"
        placeholder="Apartment, suite, unit, floor"
        value={values.line2}
        error={errors.line2}
        onChange={(e) => setField('line2', e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={fieldId('city')}
          label="City"
          name="city"
          autoComplete="address-level2"
          required
          value={values.city}
          error={errors.city}
          onChange={(e) => setField('city', e.target.value)}
        />
        <Input
          id={fieldId('state')}
          label="State / Province"
          name="state"
          autoComplete="address-level1"
          required
          value={values.state}
          error={errors.state}
          onChange={(e) => setField('state', e.target.value)}
        />
        <Input
          id={fieldId('postalCode')}
          label="Postal code"
          name="postalCode"
          autoComplete="postal-code"
          required
          value={values.postalCode}
          error={errors.postalCode}
          onChange={(e) => setField('postalCode', e.target.value)}
        />
        <Select
          id={fieldId('country')}
          label="Country"
          name="country"
          autoComplete="country-name"
          required
          options={COUNTRIES}
          value={values.country}
          error={errors.country}
          onChange={(e) => setField('country', e.target.value)}
        />
      </div>

      {showDefaultToggle && (
        <Checkbox
          id={fieldId('isDefault')}
          name="isDefault"
          label="Set as default address"
          description={defaultLocked ? 'This is your default address. Choose another address to change it.' : 'Used to pre-fill checkout.'}
          checked={defaultLocked ? true : values.isDefault}
          disabled={defaultLocked}
          onChange={(e) => setField('isDefault', e.target.checked)}
        />
      )}

      <div className="mt-2 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" loading={submitting} loadingText="Saving…" className="sm:min-w-[200px]">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default AddressForm;
