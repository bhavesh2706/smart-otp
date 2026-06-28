import { useCallback, useEffect, useState } from 'react';
import { SmartOtp } from '../native/SmartOtpModule';
import { useMounted } from './useMounted';

/**
 * Return value of {@link useSmsHash}.
 */
export interface UseSmsHashResult {
  /** The primary (first) app signature hash, or `null` until resolved/unsupported. */
  readonly hash: string | null;
  /** All signature hashes (multiple signing keys produce multiple hashes). */
  readonly hashes: readonly string[];
  /** `true` while the hash is being computed. */
  readonly loading: boolean;
  /** A resolution error, or `null`. Unsupported platforms set an error, not throw. */
  readonly error: Error | null;
  /** Re-compute the hash on demand. */
  readonly refresh: () => void;
}

/**
 * Resolve the Android SMS Retriever app-signature hash.
 *
 * The 11-character hash must be appended to your OTP SMS (last line) so Google
 * Play Services delivers it to your app. On iOS, in Expo Go, or before a native
 * rebuild, `hash` stays `null` and `error` is set — the hook never throws.
 *
 * @example
 * ```tsx
 * const { hash } = useSmsHash();
 * // Send to your backend so the SMS is formatted: "Your code is 123456\n\n<hash>"
 * ```
 */
export function useSmsHash(): UseSmsHashResult {
  const [hashes, setHashes] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useMounted();

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    SmartOtp.getAppHash()
      .then((result) => {
        if (mountedRef.current) {
          setHashes(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });
  }, [mountedRef]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    hash: hashes[0] ?? null,
    hashes,
    loading,
    error,
    refresh,
  };
}
