import { useMemo } from 'react';
import { getOtpCapabilities } from '../native/capabilities';
import type { OtpCapabilities } from '../native/capabilities';

/**
 * React hook returning the current runtime's {@link OtpCapabilities}.
 *
 * The result is memoized for the lifetime of the component — platform support
 * does not change at runtime — so it is safe to use directly in render and as a
 * dependency without causing re-renders.
 *
 * @example
 * ```tsx
 * const { androidSmsRetriever, clipboard } = useOtpCapabilities();
 * ```
 */
export function useOtpCapabilities(): OtpCapabilities {
  return useMemo(() => getOtpCapabilities(), []);
}
