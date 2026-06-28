/**
 * Manual Jest mock for the native SMS wrapper. Activated per-test with
 * `jest.mock('../../native/SmartOtpModule')`. Exposes the same surface as the
 * real module plus `__fire*` helpers to simulate native events and `__reset`
 * to clear state between tests.
 */

type ReceivedHandler = (payload: { message: string }) => void;
type TimeoutHandler = () => void;
type ErrorHandler = (payload: { error: string }) => void;

interface MockState {
  supported: boolean;
  received: ReceivedHandler | null;
  timeout: TimeoutHandler | null;
  error: ErrorHandler | null;
}

const state: MockState = {
  supported: true,
  received: null,
  timeout: null,
  error: null,
};

export class SmartOtpUnavailableError extends Error {
  constructor(message = 'unavailable') {
    super(message);
    this.name = 'SmartOtpUnavailableError';
  }
}

export const SmartOtp = {
  isSupported: jest.fn(() => state.supported),
  getAppHash: jest.fn(() =>
    Promise.resolve<readonly string[]>(['ABCDEFGHIJK'])
  ),
  startSmsRetriever: jest.fn(() => Promise.resolve(true)),
  startSmsUserConsent: jest.fn(() => Promise.resolve(true)),
  stop: jest.fn(),
  addReceivedListener: jest.fn((handler: ReceivedHandler) => {
    state.received = handler;
    return { remove: jest.fn(() => (state.received = null)) };
  }),
  addTimeoutListener: jest.fn((handler: TimeoutHandler) => {
    state.timeout = handler;
    return { remove: jest.fn(() => (state.timeout = null)) };
  }),
  addErrorListener: jest.fn((handler: ErrorHandler) => {
    state.error = handler;
    return { remove: jest.fn(() => (state.error = null)) };
  }),
};

export const isSmsRetrieverSupported = (): boolean => state.supported;

export function __setSupported(value: boolean): void {
  state.supported = value;
}

export function __fireReceived(message: string): void {
  state.received?.({ message });
}

export function __fireTimeout(): void {
  state.timeout?.();
}

export function __fireError(error: string): void {
  state.error?.({ error });
}

export function __reset(): void {
  state.supported = true;
  state.received = null;
  state.timeout = null;
  state.error = null;
  Object.values(SmartOtp).forEach((fn) => {
    if (jest.isMockFunction(fn)) {
      fn.mockClear();
    }
  });
  SmartOtp.getAppHash.mockResolvedValue(['ABCDEFGHIJK']);
  SmartOtp.startSmsRetriever.mockResolvedValue(true);
  SmartOtp.startSmsUserConsent.mockResolvedValue(true);
}
