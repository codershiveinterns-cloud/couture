'use client';

import { useState } from 'react';
import { AddressForm } from '@/components/forms/AddressForm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/context/ToastContext';
import { useAddresses } from '@/hooks/useAddresses';
import { addressToInput, formatAddressLines, MAX_ADDRESSES } from '@/lib/services/addresses';
import type { Address } from '@/lib/services/types';
import { LoadingPanel } from './accountUtils';

type Dialog = { kind: 'add' } | { kind: 'edit'; address: Address } | { kind: 'delete'; address: Address } | null;

const LINK_BUTTON =
  'text-[12px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:text-ink-4';

export function AddressesManager() {
  const { addresses, isReady, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const close = () => setDialog(null);

  const handleSetDefault = async (address: Address) => {
    if (busyId) return;
    setBusyId(address.id);
    try {
      const result = await setDefaultAddress(address.id);
      if (result.ok) toast.success('Default address updated');
      else toast.error(result.error);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!dialog || dialog.kind !== 'delete' || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteAddress(dialog.address.id);
      if (result.ok) {
        toast.success('Address removed');
        close();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!isReady) return <LoadingPanel label="Loading your addresses" />;

  const atLimit = addresses.length >= MAX_ADDRESSES;
  const addButton = (
    <Button type="button" variant="secondary" size="sm" onClick={() => setDialog({ kind: 'add' })} disabled={atLimit}>
      + Add new address
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-ink">Saved addresses</h2>
          <p className="mt-1 text-[13px] text-ink-3">
            {addresses.length === 0
              ? 'Add an address to speed up checkout.'
              : `${addresses.length} of ${MAX_ADDRESSES} addresses saved. Your default is used at checkout.`}
          </p>
        </div>
        {addresses.length > 0 && addButton}
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          title="No addresses saved"
          description="Save a shipping address and we'll pre-fill it at checkout."
          icon={<PinIcon />}
          action={addButton}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => {
            const lines = formatAddressLines(address);
            const busy = busyId === address.id;
            return (
              <li
                key={address.id}
                className={`flex flex-col rounded-sm border bg-white p-5 animate-fade-in ${
                  address.isDefault ? 'border-line-strong' : 'border-line'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-ink">{address.fullName}</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">{address.phone}</p>
                  </div>
                  {address.isDefault && (
                    <Badge variant="brand" size="sm">
                      Default
                    </Badge>
                  )}
                </div>
                <address className="mt-3 flex-1 text-[13px] not-italic leading-relaxed text-ink-2">
                  {lines.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-3">
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'edit', address })}
                    className={`${LINK_BUTTON} text-brand hover:underline`}
                  >
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSetDefault(address)}
                      className={`${LINK_BUTTON} text-ink-2 hover:text-ink hover:underline`}
                    >
                      {busy ? 'Setting…' : 'Make default'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDialog({ kind: 'delete', address })}
                    className={`${LINK_BUTTON} ml-auto text-ink-2 hover:text-brand hover:underline`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={dialog?.kind === 'add'}
        onClose={close}
        title="Add new address"
        description="We'll use this to ship your orders."
        size="lg"
        closeOnOutsideClick={false}
      >
        <AddressForm
          autoFocus
          onSubmit={async (input) => {
            const result = await addAddress(input);
            if (result.ok) {
              toast.success('Address saved');
              close();
            }
            return result;
          }}
          onCancel={close}
        />
      </Modal>

      <Modal open={dialog?.kind === 'edit'} onClose={close} title="Edit address" size="lg" closeOnOutsideClick={false}>
        {dialog?.kind === 'edit' && (
          <AddressForm
            key={dialog.address.id}
            autoFocus
            initialValues={addressToInput(dialog.address)}
            defaultLocked={dialog.address.isDefault}
            submitLabel="Save changes"
            onSubmit={async (input) => {
              const result = await updateAddress(dialog.address.id, input);
              if (result.ok) {
                toast.success('Address updated');
                close();
              }
              return result;
            }}
            onCancel={close}
          />
        )}
      </Modal>

      <Modal
        open={dialog?.kind === 'delete'}
        onClose={deleting ? () => {} : close}
        title="Remove address?"
        size="sm"
        footer={
          <>
            <Button type="button" variant="secondary" onClick={close} disabled={deleting}>
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={deleting} loadingText="Removing…" onClick={handleDelete}>
              Remove
            </Button>
          </>
        }
      >
        {dialog?.kind === 'delete' && (
          <div className="text-[14px] text-ink-2">
            <p>
              This will permanently remove the address for <span className="font-bold text-ink">{dialog.address.fullName}</span>.
              {dialog.address.isDefault && addresses.length > 1 && ' Your next saved address will become the default.'}
            </p>
            <p className="mt-3 rounded-sm bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-2">
              {formatAddressLines(dialog.address).map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default AddressesManager;
