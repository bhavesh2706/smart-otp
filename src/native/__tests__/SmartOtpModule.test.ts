import {
  isSmsRetrieverSupported,
  SmartOtp,
  SmartOtpUnavailableError,
} from '../SmartOtpModule';

/**
 * Exercises the real wrapper (no mock) in a runtime where the native module is
 * absent — the default Jest environment. Verifies graceful degradation.
 */
describe('SmartOtpModule (no native module)', () => {
  it('reports unsupported', () => {
    expect(isSmsRetrieverSupported()).toBe(false);
    expect(SmartOtp.isSupported()).toBe(false);
  });

  it('rejects async methods with SmartOtpUnavailableError', async () => {
    await expect(SmartOtp.getAppHash()).rejects.toBeInstanceOf(
      SmartOtpUnavailableError
    );
    await expect(SmartOtp.startSmsRetriever()).rejects.toBeInstanceOf(
      SmartOtpUnavailableError
    );
    await expect(SmartOtp.startSmsUserConsent()).rejects.toBeInstanceOf(
      SmartOtpUnavailableError
    );
  });

  it('treats stop() as a no-op', () => {
    expect(() => SmartOtp.stop()).not.toThrow();
  });

  it('returns inert, removable subscriptions for listeners', () => {
    const sub = SmartOtp.addReceivedListener(() => undefined);
    expect(typeof sub.remove).toBe('function');
    expect(() => sub.remove()).not.toThrow();
    expect(() =>
      SmartOtp.addTimeoutListener(() => undefined).remove()
    ).not.toThrow();
    expect(() =>
      SmartOtp.addErrorListener(() => undefined).remove()
    ).not.toThrow();
  });
});
