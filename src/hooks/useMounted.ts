import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Tracks whether the owning component is still mounted.
 *
 * Guard asynchronous state updates with the returned ref to avoid setting state
 * after unmount (a common source of warnings and leaks):
 *
 * ```ts
 * const mounted = useMounted();
 * doAsync().then((value) => {
 *   if (mounted.current) setValue(value);
 * });
 * ```
 *
 * The ref re-arms on every mount, so it stays correct under Fast Refresh and
 * React StrictMode's double-invoked effects.
 */
export function useMounted(): RefObject<boolean> {
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return mounted;
}
