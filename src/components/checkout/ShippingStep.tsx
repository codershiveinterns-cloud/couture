'use client';

import { useState } from 'react';
import { AddressForm } from '@/components/forms/AddressForm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from '@/context/ToastContext';
import { useAddresses } from '@/hooks/useAddresses';
import { formatAddressLines } from '@/lib/services/addresses';
import type { Address } from '@/lib/services/types';
import { RadioCard } from './RadioCard';

export interface ShippingStepProps {
  addresses: readonly Address[];
  selectedId: string | null;
  onSelect(addressId: string): void;
  onNext(): void;
}

export function ShippingStep({ addresses, selectedId, onSelect, onNext }: ShippingStepProps) {
  const { addAddress } = useAddresses();
  const [adding, setAdding] = useState(false);
  const showForm = adding || addresses.length === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-ink">Select Delivery Address</h2>
        {!showForm && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
            + Add new address
          </Button>
        )}
      </div>

      {addresses.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-[12px] font-bold uppercase tracking-wide text-ink-3">Saved addresses</legend>
          {addresses.map((address) => {
            const lines = formatAddressLines(address);
            return (
              <RadioCard
                key={address.id}
                id={`address-${address.id}`}
                name="shipping-address"
                value={address.id}
                checked={selectedId === address.id}
                onChange={onSelect}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-bold text-ink">{address.fullName}</span>
                  {address.isDefault && (
                    <Badge variant="outline" size="sm">
                      Default
                    </Badge>
                  )}
                </span>
                <span className="mt-1 block text-[13px] text-ink-2">
                  {lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
                <span className="mt-1.5 block text-[13px] text-ink-2">
                  Mobile: <span className="font-bold text-ink">{address.phone}</span>
                </span>
              </RadioCard>
            );
          })}
        </fieldset>
      )}

      {showForm && (
        <div className="rounded-sm border border-line bg-white p-4 sm:p-5 animate-fade-in">
          <h3 className="mb-4 text-[12px] font-bold uppercase tracking-wide text-ink-3">
            {addresses.length === 0 ? 'Add your first address' : 'Add new address'}
          </h3>
          <AddressForm
            autoFocus={adding}
            submitLabel="Save and use this address"
            onSubmit={async (input) => {
              const result = await addAddress(input);
              if (result.ok) {
                onSelect(result.data.id);
                setAdding(false);
                toast.success('Address saved', { id: 'checkout-address' });
              }
              return result;
            }}
            onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
          />
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button href="/cart" variant="ghost" className="px-0">
          Back to bag
        </Button>
        <Button onClick={onNext} disabled={!selectedId} className="sm:min-w-[200px]">
          Continue
        </Button>
      </div>
    </div>
  );
}

export default ShippingStep;
