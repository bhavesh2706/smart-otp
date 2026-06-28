import { getOtpCapabilities } from '../capabilities';

/**
 * Runs against the real modules in the default Jest environment: iOS platform,
 * no native SMS module, no clipboard module. Verifies the honest capability
 * snapshot.
 */
describe('getOtpCapabilities (default iOS test env)', () => {
  it('reports iOS one-time-code and nothing native-Android', () => {
    const caps = getOtpCapabilities();
    expect(caps.platform).toBe('ios');
    expect(caps.iosOneTimeCode).toBe(true);
    expect(caps.androidSmsRetriever).toBe(false);
    expect(caps.androidSmsUserConsent).toBe(false);
    expect(caps.clipboard).toBe(false);
  });

  it('returns a stable shape', () => {
    expect(Object.keys(getOtpCapabilities()).sort()).toEqual([
      'androidSmsRetriever',
      'androidSmsUserConsent',
      'clipboard',
      'iosOneTimeCode',
      'platform',
    ]);
  });
});
