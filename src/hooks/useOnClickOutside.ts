import { useEffect, useRef, type RefObject } from 'react';

type Target = RefObject<HTMLElement | null>;

export function useOnClickOutside(
  refs: Target | readonly Target[],
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);
  const refsRef = useRef(refs);

  useEffect(() => {
    handlerRef.current = handler;
    refsRef.current = refs;
  });

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: MouseEvent | TouchEvent) => {
      const list = Array.isArray(refsRef.current) ? refsRef.current : [refsRef.current as Target];
      const target = event.target as Node | null;
      if (list.some((ref) => ref.current && target && ref.current.contains(target))) return;
      handlerRef.current(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener, { passive: true });
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [enabled]);
}
