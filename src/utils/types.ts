/**
 * Shared, platform-independent types for react-native-smart-otp.
 *
 * These types contain no React Native imports so they can be consumed from
 * pure-logic modules (hooks, validators) and from native-bridge code alike
 * without pulling in UI dependencies.
 *
 * @packageDocumentation
 */

/**
 * Character set accepted by the OTP input.
 *
 * - `'numeric'`    — digits `0-9` only. Surfaces a number pad keyboard.
 * - `'alphanumeric'` — digits and ASCII letters `a-z`, `A-Z`.
 */
export type OTPInputType = 'numeric' | 'alphanumeric';

/**
 * Autocomplete strategy for one-time codes.
 *
 * - `'sms-otp'` — opt in to platform autofill. On iOS this maps to
 *   `textContentType="oneTimeCode"`; on Android to `autoComplete="sms-otp"`.
 * - `'off'`     — disable platform autofill entirely.
 */
export type OTPAutoCompleteType = 'sms-otp' | 'off';

/**
 * Visual / logical state of a single OTP cell. Used by themes and by
 * accessibility announcements to describe each cell consistently.
 */
export type OTPCellState =
  | 'empty'
  | 'filled'
  | 'focused'
  | 'error'
  | 'success'
  | 'disabled';

/**
 * Imperative handle exposed by {@link SmartOTPInput} via `ref`.
 *
 * @example
 * ```tsx
 * const ref = useRef<SmartOTPInputRef>(null);
 * ref.current?.focus();
 * ref.current?.clear();
 * ```
 */
export interface SmartOTPInputRef {
  /** Focus the input and raise the keyboard. */
  readonly focus: () => void;
  /** Blur the input and dismiss the keyboard. */
  readonly blur: () => void;
  /** Clear every cell. No-op in controlled mode beyond emitting `onChange('')`. */
  readonly clear: () => void;
  /**
   * Programmatically set the full code. The value is sanitized against the
   * active {@link OTPInputType} and clamped to `length` before being applied.
   */
  readonly setValue: (code: string) => void;
}
