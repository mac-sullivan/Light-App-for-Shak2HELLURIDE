import { useCallback, useEffect, useRef } from 'react';

/**
 * Rate-limit a callback (for sliders that fire continuously) while guaranteeing
 * the final value still lands via a trailing call. SP110E writes-without-
 * response can be dropped if sent too fast, so we cap the fire rate.
 */
export function useThrottledCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  intervalMs = 80
): (...args: A) => void {
  const last = useRef(0);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(
    () => () => {
      if (trailing.current) clearTimeout(trailing.current);
    },
    []
  );

  return useCallback(
    (...args: A) => {
      const now = Date.now();
      const remaining = intervalMs - (now - last.current);
      if (remaining <= 0) {
        last.current = now;
        fnRef.current(...args);
      } else {
        if (trailing.current) clearTimeout(trailing.current);
        trailing.current = setTimeout(() => {
          last.current = Date.now();
          fnRef.current(...args);
        }, remaining);
      }
    },
    [intervalMs]
  );
}
