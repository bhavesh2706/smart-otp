import { Platform } from 'react-native';
import { isClipboardSupported } from '../utils/clipboard';
import { isSmsRetrieverSupported } from './SmartOtpModule';

/**
 * A snapshot of which OTP auto-fill mechanisms are available in the current
 * runtime. Lets consumers tailor UI (e.g. hide a "paste code" button, or show
 * "we'll detect your code automatically") without platform branching.
 *
 * @packageDocumentation
 */
export interface OtpCapabilities {
  /** The host platform (`'ios'`, `'android'`, `'web'`, `'windows'`, `'macos'`). */
  readonly platform: typeof Platform.OS;
  /**
   * iOS keyboard one-time-code autofill (`textContentType="oneTimeCode"`). This
   * is built into `SmartOTPInput` and needs no native module. `true` on iOS.
   */
  readonly iosOneTimeCode: boolean;
  /** Android automatic SMS Retriever flow (native module present). */
  readonly androidSmsRetriever: boolean;
  /** Android SMS User Consent dialog flow (native module present). */
  readonly androidSmsUserConsent: boolean;
  /** Clipboard reading (optional `@react-native-clipboard/clipboard` present). */
  readonly clipboard: boolean;
}

/**
 * Resolve the OTP auto-fill capabilities of the current runtime.
 *
 * Cheap to call; reads platform constants and module presence. Re-evaluate
 * rather than caching across hot-reloads so a freshly-linked native module is
 * reflected.
 *
 * @example
 * ```ts
 * const caps = getOtpCapabilities();
 * if (!caps.androidSmsRetriever && !caps.iosOneTimeCode) {
 *   showManualPasteHint();
 * }
 * ```
 */
export function getOtpCapabilities(): OtpCapabilities {
  const isIOS = Platform.OS === 'ios';
  const smsSupported = isSmsRetrieverSupported();
  return {
    platform: Platform.OS,
    iosOneTimeCode: isIOS,
    androidSmsRetriever: smsSupported,
    androidSmsUserConsent: smsSupported,
    clipboard: isClipboardSupported(),
  };
}
