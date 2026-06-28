import type { OtpCapabilities } from '../native/capabilities';
import { useClipboardPaste } from './useClipboardPaste';
import { useOtpCapabilities } from './useOtpCapabilities';
import { useSmsRetriever } from './useSmsRetriever';
import type { SmsRetrieverMethod } from './useSmsRetriever';
import type { ClipboardReader } from '../utils/clipboard';
import type { OTPInputType } from '../utils/types';

/** Fine-grained SMS configuration for {@link useOtpAutofill}. */
export interface OtpAutofillSmsConfig {
  /** Flow to use. Defaults to `'retriever'`. */
  readonly method?: SmsRetrieverMethod;
  /** User-Consent sender filter. Empty = any sender. */
  readonly senderPhoneNumber?: string;
}

/**
 * Options for {@link useOtpAutofill}.
 */
export interface UseOtpAutofillOptions {
  /** Expected code length. */
  readonly length: number;
  /** Called with a code from whichever source detects it first. */
  readonly onCode: (code: string) => void;
  /** Character set. Defaults to `'numeric'`. */
  readonly type?: OTPInputType;
  /** Master enable switch. Defaults to `true`. */
  readonly enabled?: boolean;
  /**
   * Enable Android SMS detection. `true` (default) uses the retriever flow;
   * pass an object to choose the user-consent flow or a sender filter; `false`
   * disables SMS detection.
   */
  readonly sms?: boolean | OtpAutofillSmsConfig;
  /** Enable clipboard detection. Defaults to `true`. */
  readonly clipboard?: boolean;
  /** Inject a custom clipboard reader (tests / bespoke clipboard). */
  readonly getClipboardString?: ClipboardReader;
  /** Called on a Google Play Services SMS error. */
  readonly onError?: (error: Error) => void;
  /** Called when the SMS window times out without a message. */
  readonly onTimeout?: () => void;
}

/**
 * Return value of {@link useOtpAutofill}.
 */
export interface UseOtpAutofillResult {
  /** Capabilities of the current runtime. */
  readonly capabilities: OtpCapabilities;
  /** `true` while the Android SMS flow is armed. */
  readonly isListening: boolean;
  /** (Re)arm the SMS flow. Resolves `false` where SMS is unsupported. */
  readonly start: () => Promise<boolean>;
  /** Stop the SMS flow. */
  readonly stop: () => void;
  /** Force an immediate clipboard read. */
  readonly checkClipboard: () => void;
}

/**
 * One hook that wires up **every** available OTP auto-fill source for the
 * current platform and reports a code through a single `onCode` callback:
 *
 * - **Android** — SMS Retriever (or User Consent) detects the code from an
 *   incoming SMS and extracts it.
 * - **All platforms** — clipboard detection picks up a code the user copied.
 * - **iOS** — keyboard `oneTimeCode` autofill is handled by `SmartOTPInput`
 *   itself and needs no hook.
 *
 * Each source degrades independently: missing native modules simply contribute
 * nothing. Pair with `SmartOTPInput` for a complete, cross-platform experience.
 *
 * @example
 * ```tsx
 * const [code, setCode] = useState('');
 * const { capabilities } = useOtpAutofill({ length: 6, onCode: setCode });
 *
 * <SmartOTPInput length={6} value={code} onChange={setCode} />;
 * ```
 */
export function useOtpAutofill({
  length,
  onCode,
  type = 'numeric',
  enabled = true,
  sms = true,
  clipboard = true,
  getClipboardString,
  onError,
  onTimeout,
}: UseOtpAutofillOptions): UseOtpAutofillResult {
  const smsConfig: OtpAutofillSmsConfig = typeof sms === 'object' ? sms : {};
  const smsEnabled = enabled && sms !== false;
  const clipboardEnabled = enabled && clipboard !== false;

  const { isListening, start, stop } = useSmsRetriever({
    length,
    type,
    enabled: smsEnabled,
    method: smsConfig.method ?? 'retriever',
    senderPhoneNumber: smsConfig.senderPhoneNumber ?? '',
    onReceived: ({ otp }) => {
      if (otp !== null) {
        onCode(otp);
      }
    },
    onError,
    onTimeout,
  });

  const { check: checkClipboard } = useClipboardPaste({
    length,
    type,
    enabled: clipboardEnabled,
    onDetect: onCode,
    ...(getClipboardString ? { getClipboardString } : {}),
  });

  const capabilities = useOtpCapabilities();

  return {
    capabilities,
    isListening,
    start,
    stop,
    checkClipboard,
  };
}
