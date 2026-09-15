'use client';

import { useEffect, useState } from 'react';

function untilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const total = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

/**
 * "Ends in HH:MM:SS" chip counting down to local midnight. Renders a
 * placeholder on the server and only sets state from the timer callback,
 * so there is no hydration mismatch.
 */
export default function Countdown() {
  const [label, setLabel] = useState('--:--:--');

  useEffect(() => {
    const tick = () => setLabel(untilMidnight());
    const timer = setInterval(tick, 1000);
    const kick = setTimeout(tick, 0);
    return () => {
      clearInterval(timer);
      clearTimeout(kick);
    };
  }, []);

  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={`Deals end in ${label}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-[12px] font-bold text-brand"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Ends in <span className="tabular-nums tracking-wide">{label}</span>
    </span>
  );
}
