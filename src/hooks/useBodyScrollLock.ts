import { useEffect } from 'react';

const lock = { count: 0, previousOverflow: '' };

function acquire() {
  if (lock.count === 0) {
    lock.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lock.count += 1;
}

function release() {
  lock.count = Math.max(0, lock.count - 1);
  if (lock.count === 0) document.body.style.overflow = lock.previousOverflow;
}

/** Prevents page scroll while `active` (ref-counted so nested overlays behave). */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    acquire();
    return release;
  }, [active]);
}
