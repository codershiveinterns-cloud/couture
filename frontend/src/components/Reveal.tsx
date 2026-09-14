'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Fades + slides an element up the first time it scrolls into view.
// Pure CSS handles the transition; this just toggles the class at the
// right moment so sections don't all animate at once on page load.
export default function Reveal({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      el.style.transitionDelay = `${delay}ms`;
      el.classList.add('is-visible');
      observer.disconnect();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        // A fast scroll (trackpad flick, Page Down, or a large programmatic
        // jump) can move an element from "below the viewport" to "already
        // scrolled past" between two intersection samples, so it never
        // reports isIntersecting. Treat "already above the viewport" the
        // same as "entered the viewport" so it still reveals.
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          reveal();
        }
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const Element = Tag as 'div';

  return (
    <Element ref={ref} className={`reveal ${className}`}>
      {children}
    </Element>
  );
}
