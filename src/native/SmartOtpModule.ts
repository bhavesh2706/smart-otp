import { NativeEventEmitter, Platform } from 'react-native';
import type { EmitterSubscription } from 'react-native';
import NativeSmartOtp from '../specs/NativeSmartOtp';

/**
 * Graceful-degradation wrapper around the native Android SMS module.
 *
 * Every method is safe to call on any platform: when the native module is
 * absent (iOS, Expo Go, or a not-yet-rebuilt app) async methods reject with a
 * {@link SmartOtpUnavailableError} and listeners are inert no-ops. This keeps
 * the public hooks free of platform branching.
 *
 * @packageDocumentation
 */

/** Native event names emitted by the Android module. */
const EVENT = {
  received: 'smartOtp:received',
  timeout: 'smartOtp:timeout',
  error: 'smartOtp:error',
} as const;

/** Payload for the `received` event — the raw SMS body. OTP extraction is done in JS. */
export interface SmsReceivedPayload {
  readonly message: string;
}

/** Payload for the `error` event. */
export interface SmsErrorPayload {
  readonly error: string;
}

/**
 * Thrown (as a rejection) when an SMS operation is attempted but the native
 * module is unavailable in the current runtime.
 */
export class SmartOtpUnavailableError extends Error {
  constructor(
    message = 'react-native-smart-otp: native SMS module unavailable'
  ) {
    super(message);
    this.name = 'SmartOtpUnavailableError';
  }
}

const isAndroid = Platform.OS === 'android';

/**
 * Whether the native SMS Retriever module is available in this runtime. `true`
 * only on Android with the rebuilt native module present.
 */
export function isSmsRetrieverSupported(): boolean {
  return isAndroid && NativeSmartOtp != null;
}

/**
 * Lazily-created emitter. Created only when the native module exists so we never
 * construct a `NativeEventEmitter` around `null`.
 */
let emitter: NativeEventEmitter | null = null;

function getEmitter(): NativeEventEmitter | null {
  if (!isSmsRetrieverSupported()) {
    return null;
  }
  if (emitter === null) {
    // The native module emits through the global `RCTDeviceEventEmitter`, so we
    // construct the emitter without a module argument. Passing the TurboModule
    // here triggers RN's "called without the required addListener method"
    // warning, and is unnecessary since this module is Android-only.
    emitter = new NativeEventEmitter();
  }
  return emitter;
}

function unavailable<T>(): Promise<T> {
  return Promise.reject(new SmartOtpUnavailableError());
}

const NOOP_SUBSCRIPTION: Pick<EmitterSubscription, 'remove'> = {
  remove: () => undefined,
};

/**
 * The native SMS module surface. All methods degrade gracefully off-Android or
 * when the native module is missing.
 */
export const SmartOtp = {
  isSupported: isSmsRetrieverSupported,

  /** @see {@link Spec.getAppHash} */
  getAppHash(): Promise<readonly string[]> {
    return isSmsRetrieverSupported()
      ? (NativeSmartOtp as NonNullable<typeof NativeSmartOtp>).getAppHash()
      : unavailable<readonly string[]>();
  },

  /** @see {@link Spec.startSmsRetriever} */
  startSmsRetriever(): Promise<boolean> {
    return isSmsRetrieverSupported()
      ? (
          NativeSmartOtp as NonNullable<typeof NativeSmartOtp>
        ).startSmsRetriever()
      : unavailable<boolean>();
  },

  /** @see {@link Spec.startSmsUserConsent} */
  startSmsUserConsent(senderPhoneNumber = ''): Promise<boolean> {
    return isSmsRetrieverSupported()
      ? (
          NativeSmartOtp as NonNullable<typeof NativeSmartOtp>
        ).startSmsUserConsent(senderPhoneNumber)
      : unavailable<boolean>();
  },

  /** @see {@link Spec.stopSmsRetriever} */
  stop(): void {
    if (isSmsRetrieverSupported()) {
      (NativeSmartOtp as NonNullable<typeof NativeSmartOtp>).stopSmsRetriever();
    }
  },

  /** Subscribe to the raw-SMS `received` event. Returns a removable subscription. */
  addReceivedListener(
    handler: (payload: SmsReceivedPayload) => void
  ): Pick<EmitterSubscription, 'remove'> {
    return (
      getEmitter()?.addListener(EVENT.received, handler) ?? NOOP_SUBSCRIPTION
    );
  },

  /** Subscribe to the `timeout` event (no SMS arrived within the window). */
  addTimeoutListener(handler: () => void): Pick<EmitterSubscription, 'remove'> {
    return (
      getEmitter()?.addListener(EVENT.timeout, handler) ?? NOOP_SUBSCRIPTION
    );
  },

  /** Subscribe to the `error` event. */
  addErrorListener(
    handler: (payload: SmsErrorPayload) => void
  ): Pick<EmitterSubscription, 'remove'> {
    return getEmitter()?.addListener(EVENT.error, handler) ?? NOOP_SUBSCRIPTION;
  },
} as const;
