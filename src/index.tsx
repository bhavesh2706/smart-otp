/**
 * react-native-smart-otp — public entry point.
 *
 * Milestone 1 surface: the core {@link SmartOTPInput} component, its
 * presentational {@link OTPCell}, the built-in theme system and the shared
 * sanitization utilities. Native SMS modules, timers and advanced themes are
 * introduced in later milestones without breaking this surface.
 *
 * @packageDocumentation
 */

export { SmartOTPInput } from './components/SmartOTPInput';
export type {
  SmartOTPInputProps,
  OTPCellRenderInfo,
} from './components/SmartOTPInput';

export { OTPCell } from './components/OTPCell';
export type { OTPCellProps } from './components/OTPCell';

export { useCountdown } from './hooks/useCountdown';
export type {
  UseCountdownOptions,
  UseCountdownResult,
} from './hooks/useCountdown';

export { useClipboardPaste } from './hooks/useClipboardPaste';
export type {
  UseClipboardPasteOptions,
  UseClipboardPasteResult,
} from './hooks/useClipboardPaste';

export {
  isClipboardSupported,
  defaultClipboardReader,
} from './utils/clipboard';
export type { ClipboardReader } from './utils/clipboard';

export { useSmsHash } from './hooks/useSmsHash';
export type { UseSmsHashResult } from './hooks/useSmsHash';

export { useSmsRetriever } from './hooks/useSmsRetriever';
export type {
  UseSmsRetrieverOptions,
  UseSmsRetrieverResult,
  SmsRetrieverMethod,
  SmsReceivedResult,
} from './hooks/useSmsRetriever';

export {
  SmartOtp,
  isSmsRetrieverSupported,
  SmartOtpUnavailableError,
} from './native/SmartOtpModule';
export type {
  SmsReceivedPayload,
  SmsErrorPayload,
} from './native/SmartOtpModule';

export { getOtpCapabilities } from './native/capabilities';
export type { OtpCapabilities } from './native/capabilities';

export { useOtpCapabilities } from './hooks/useOtpCapabilities';

export { useOtpAutofill } from './hooks/useOtpAutofill';
export type {
  UseOtpAutofillOptions,
  UseOtpAutofillResult,
  OtpAutofillSmsConfig,
} from './hooks/useOtpAutofill';

export {
  getDefaultTheme,
  getOutlinedTheme,
  getFilledTheme,
  getMinimalTheme,
  createTheme,
} from './themes/defaultTheme';
export type {
  SmartOTPTheme,
  SmartOTPVariant,
  SmartOTPThemeOverrides,
} from './themes/defaultTheme';
export {
  SmartOTPProvider,
  useSmartOTPTheme,
  useSmartOTPLabels,
} from './themes/ThemeContext';
export type { SmartOTPProviderProps } from './themes/ThemeContext';
export { DEFAULT_LABELS, resolveLabels } from './utils/labels';
export type { SmartOTPLabels, SmartOTPLabelsInput } from './utils/labels';
export { palette, radius, spacing, typography } from './themes/tokens';
export type { ColorScheme } from './themes/tokens';

export { useReduceMotion } from './hooks/useReduceMotion';
export { useOtpFeedback } from './animations/useOtpFeedback';
export type {
  UseOtpFeedbackOptions,
  UseOtpFeedbackResult,
} from './animations/useOtpFeedback';

export { sanitizeOTP, toCells, extractOTP } from './utils/sanitize';
export { stripHoles } from './utils/reconcile';

export type {
  OTPAutoCompleteType,
  OTPCellState,
  OTPInputType,
  SmartOTPInputRef,
} from './utils/types';
