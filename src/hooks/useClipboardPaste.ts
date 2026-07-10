import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useMounted } from './useMounted';
import {
  defaultClipboardReader,
  isClipboardSupported,
} from '../utils/clipboard';
import type { ClipboardReader } from '../utils/clipboard';
import { extractOTP } from '../utils/sanitize';
import type { OTPInputType } from '../utils/types';

/**
 * Options for {@link useClipboardPaste}.
 */
export interface UseClipboardPasteOptions {
  /** Exact code length to look for in the clipboard. */
  readonly length: number;
  /**
   * Called with a detected code. Automatic reads (mount / foreground / poll)
   * are deduplicated against the previous match; an explicit {@link check} call
   * always fires, even for a repeated code.
   */
  readonly onDetect: (code: string) => void;
  /** Character set to match. Defaults to `'numeric'`. */
  readonly type?: OTPInputType;
  /** Enable detection. Defaults to `true`. */
  readonly enabled?: boolean;
  /**
   * Optional continuous polling interval in milliseconds. Off by default — the
   * hook instead reads on mount and whenever the app returns to the foreground,
   * which avoids the repeated iOS paste-notification banner that polling causes.
   * Set only if your UX genuinely needs sub-foreground latency.
   */
  readonly pollInterval?: number;
  /**
   * Inject a custom clipboard reader (e.g. for tests or a bespoke clipboard
   * implementation). Defaults to the optional clipboard module.
   */
  readonly getClipboardString?: ClipboardReader;
}

/**
 * Return value of {@link useClipboardPaste}.
 */
export interface UseClipboardPasteResult {
  /** `true` when a clipboard reader is available in this runtime. */
  readonly isSupported: boolean;
  /**
   * Force an immediate clipboard read (e.g. from a "Paste code" button). Unlike
   * the automatic reads this bypasses dedup and always applies a detected code,
   * so re-checking after clearing the field re-fills it.
   */
  readonly check: () => void;
}

/**
 * Detect a one-time code on the clipboard and surface it via `onDetect`.
 *
 * By default the hook reads the clipboard on mount and each time the app
 * returns to the foreground (the moment a user typically copies a code from
 * their Messages app and switches back). Continuous polling is opt-in via
 * `pollInterval`. Detected codes are deduplicated, so the same clipboard value
 * fires `onDetect` only once.
 *
 * Degrades gracefully: when no clipboard reader is available (the optional
 * `@react-native-clipboard/clipboard` package is not installed and no custom
 * reader is provided) the hook is inert and `isSupported` is `false`.
 *
 * @example
 * ```tsx
 * const [code, setCode] = useState('');
 * useClipboardPaste({ length: 6, onDetect: setCode });
 * ```
 */
export function useClipboardPaste({
  length,
  onDetect,
  type = 'numeric',
  enabled = true,
  pollInterval,
  getClipboardString,
}: UseClipboardPasteOptions): UseClipboardPasteResult {
  const reader = getClipboardString ?? defaultClipboardReader;
  const isSupported =
    getClipboardString !== undefined || isClipboardSupported();

  // Refs keep `check` referentially stable and guard against state updates
  // after unmount when the async read resolves late.
  const onDetectRef = useRef(onDetect);
  onDetectRef.current = onDetect;
  const lastDetectedRef = useRef<string | null>(null);
  const mountedRef = useMounted();

  // `force` bypasses the dedup. Automatic reads (mount / foreground / poll) pass
  // `false` so the same clipboard value fires `onDetect` only once — this stops
  // the repeated iOS paste banner and unwanted re-fills. An explicit user action
  // (the returned `check`, e.g. a "Paste code" button) passes `true`: the user
  // asked for it, so it must apply even if the code was already detected — and
  // even after the field was cleared, where the value is unchanged.
  const runCheck = useCallback(
    (force: boolean) => {
      if (!enabled || !isSupported) {
        return;
      }
      reader()
        .then((contents) => {
          if (!mountedRef.current || contents.length === 0) {
            return;
          }
          const code = extractOTP(contents, type, length);
          if (code !== null && (force || code !== lastDetectedRef.current)) {
            lastDetectedRef.current = code;
            onDetectRef.current(code);
          }
        })
        .catch(() => {
          // Clipboard read can reject (permissions, platform quirks). A failed
          // read simply yields no detection; never surface it as an app error.
        });
    },
    [enabled, isSupported, reader, type, length, mountedRef]
  );

  const check = useCallback(() => runCheck(true), [runCheck]);

  useEffect(() => {
    if (!enabled || !isSupported) {
      return;
    }

    runCheck(false);

    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        if (status === 'active') {
          runCheck(false);
        }
      }
    );

    const intervalId =
      pollInterval && pollInterval > 0
        ? setInterval(() => runCheck(false), pollInterval)
        : null;

    return () => {
      subscription.remove();
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, isSupported, pollInterval, runCheck]);

  return { isSupported, check };
}
