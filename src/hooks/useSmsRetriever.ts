import { useCallback, useEffect, useRef, useState } from 'react';
import { SmartOtp } from '../native/SmartOtpModule';
import { useMounted } from './useMounted';
import type {
  SmsErrorPayload,
  SmsReceivedPayload,
} from '../native/SmartOtpModule';
import { extractOTP } from '../utils/sanitize';
import type { OTPInputType } from '../utils/types';

/** Which Android SMS flow to arm. */
export type SmsRetrieverMethod = 'retriever' | 'userConsent';

/** Payload passed to `onReceived`. */
export interface SmsReceivedResult {
  /** The full SMS body. */
  readonly message: string;
  /** The extracted code, or `null` if no exact-length code was found. */
  readonly otp: string | null;
}

/**
 * Options for {@link useSmsRetriever}.
 */
export interface UseSmsRetrieverOptions {
  /** Expected code length, used to extract the OTP from the SMS body. */
  readonly length: number;
  /** Called when an SMS arrives, with the body and extracted code. */
  readonly onReceived: (result: SmsReceivedResult) => void;
  /** Character set for extraction. Defaults to `'numeric'`. */
  readonly type?: OTPInputType;
  /**
   * Flow to use. `'retriever'` (default) is fully automatic and needs no
   * permission. `'userConsent'` shows a one-tap system consent dialog.
   */
  readonly method?: SmsRetrieverMethod;
  /** For `'userConsent'`: restrict to this sender. Empty = any sender. */
  readonly senderPhoneNumber?: string;
  /** Arm the listener automatically on mount. Defaults to `true`. */
  readonly autoStart?: boolean;
  /** Master enable switch. Defaults to `true`. */
  readonly enabled?: boolean;
  /** Called if Google Play Services reports an error. */
  readonly onError?: (error: Error) => void;
  /** Called when no SMS arrives within the 5-minute window. */
  readonly onTimeout?: () => void;
}

/**
 * Return value of {@link useSmsRetriever}.
 */
export interface UseSmsRetrieverResult {
  /** `true` when the native SMS module is available (Android, rebuilt app). */
  readonly isSupported: boolean;
  /** `true` while a flow is armed and waiting for an SMS. */
  readonly isListening: boolean;
  /** Arm the SMS flow. Resolves `false` if unsupported or it could not start. */
  readonly start: () => Promise<boolean>;
  /** Stop listening and unregister the native receiver. */
  readonly stop: () => void;
}

/**
 * Listen for an incoming OTP SMS on Android and auto-fill the code.
 *
 * Wraps the native SMS Retriever / User Consent flows, extracting the code from
 * the message body via {@link extractOTP}. All native listeners are removed and
 * the receiver is stopped on unmount, so nothing leaks. On unsupported runtimes
 * the hook is inert and `isSupported` is `false` — pair it with iOS
 * `oneTimeCode` autofill (already built into `SmartOTPInput`) for full coverage.
 *
 * @example
 * ```tsx
 * const [code, setCode] = useState('');
 * useSmsRetriever({
 *   length: 6,
 *   onReceived: ({ otp }) => otp && setCode(otp),
 * });
 * ```
 */
export function useSmsRetriever({
  length,
  onReceived,
  type = 'numeric',
  method = 'retriever',
  senderPhoneNumber = '',
  autoStart = true,
  enabled = true,
  onError,
  onTimeout,
}: UseSmsRetrieverOptions): UseSmsRetrieverResult {
  const isSupported = SmartOtp.isSupported();
  const [isListening, setIsListening] = useState(false);

  // Stable refs so callback identity changes never re-arm native listeners.
  const onReceivedRef = useRef(onReceived);
  onReceivedRef.current = onReceived;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const configRef = useRef({ length, type, method, senderPhoneNumber });
  configRef.current = { length, type, method, senderPhoneNumber };

  const mountedRef = useMounted();

  const stop = useCallback(() => {
    SmartOtp.stop();
    if (mountedRef.current) {
      setIsListening(false);
    }
  }, [mountedRef]);

  const start = useCallback(async (): Promise<boolean> => {
    if (!enabled || !isSupported) {
      return false;
    }
    const { method: m, senderPhoneNumber: sender } = configRef.current;
    try {
      const ok =
        m === 'userConsent'
          ? await SmartOtp.startSmsUserConsent(sender)
          : await SmartOtp.startSmsRetriever();
      if (mountedRef.current) {
        setIsListening(ok);
      }
      return ok;
    } catch (err: unknown) {
      onErrorRef.current?.(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [enabled, isSupported, mountedRef]);

  useEffect(() => {
    if (!enabled || !isSupported) {
      return;
    }

    const received = SmartOtp.addReceivedListener(
      ({ message }: SmsReceivedPayload) => {
        const { length: len, type: t } = configRef.current;
        onReceivedRef.current({
          message,
          otp: extractOTP(message, t, len),
        });
        // A delivered SMS ends the window; reflect that we're no longer waiting.
        if (mountedRef.current) {
          setIsListening(false);
        }
      }
    );

    const timeout = SmartOtp.addTimeoutListener(() => {
      if (mountedRef.current) {
        setIsListening(false);
      }
      onTimeoutRef.current?.();
    });

    const errored = SmartOtp.addErrorListener(({ error }: SmsErrorPayload) => {
      if (mountedRef.current) {
        setIsListening(false);
      }
      onErrorRef.current?.(new Error(error));
    });

    if (autoStart) {
      void start();
    }

    return () => {
      received.remove();
      timeout.remove();
      errored.remove();
      SmartOtp.stop();
    };
  }, [enabled, isSupported, autoStart, start, mountedRef]);

  return { isSupported, isListening, start, stop };
}
