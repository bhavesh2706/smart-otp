import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen TurboModule spec for the native Android SMS module.
 *
 * The module is **Android-only** (iOS reads one-time codes through the keyboard
 * `oneTimeCode` autofill, which needs no native bridge). It is resolved with
 * `TurboModuleRegistry.get` — not `getEnforcing` — so the default export is
 * `null` when the native module is unavailable (Expo Go, iOS, or an app that
 * has not rebuilt). All consumers must treat it as nullable; see
 * `src/native/SmartOtpModule.ts` for the graceful-degradation wrapper.
 *
 * Events are delivered through `NativeEventEmitter` rather than typed codegen
 * events for maximum compatibility across React Native versions; `addListener`
 * and `removeListeners` satisfy the emitter contract.
 *
 * @internal This spec is an implementation detail. Public consumers use the
 * `useSmsRetriever` / `useSmsHash` hooks or the `SmartOtp` wrapper.
 */
export interface Spec extends TurboModule {
  /**
   * Compute the app's SMS Retriever signature hashes. The 11-character hash
   * must be appended to the OTP SMS so Google Play Services can route it to
   * this app. Returns one hash per signing key (usually one).
   */
  getAppHash(): Promise<string[]>;

  /**
   * Start the automatic SMS Retriever flow (no user interaction, no
   * permission). Resolves `true` once the retriever is armed. A matching SMS
   * within the 5-minute window emits the `received` event; otherwise `timeout`.
   */
  startSmsRetriever(): Promise<boolean>;

  /**
   * Start the SMS User Consent flow, which shows a system consent dialog before
   * exposing the message. Pass a sender phone number to filter, or an empty
   * string to accept any sender. Resolves `true` once armed.
   */
  startSmsUserConsent(senderPhoneNumber: string): Promise<boolean>;

  /** Stop any active flow and unregister the broadcast receiver. */
  stopSmsRetriever(): void;

  /** Required by `NativeEventEmitter`. Registers interest in an event. */
  addListener(eventName: string): void;

  /** Required by `NativeEventEmitter`. Releases `count` listeners. */
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.get<Spec>('SmartOtp');
