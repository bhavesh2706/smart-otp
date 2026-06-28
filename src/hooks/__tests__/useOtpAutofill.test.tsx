import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('../../native/SmartOtpModule');

import { useOtpAutofill } from '../useOtpAutofill';
import type * as SmartOtpModuleMock from '../../native/__mocks__/SmartOtpModule';

const mock = jest.requireMock(
  '../../native/SmartOtpModule'
) as typeof SmartOtpModuleMock;

describe('useOtpAutofill', () => {
  beforeEach(() => {
    mock.__reset();
  });

  it('reports capabilities and arms SMS by default', async () => {
    const { result } = renderHook(() =>
      useOtpAutofill({ length: 6, onCode: jest.fn() })
    );
    expect(result.current.capabilities.androidSmsRetriever).toBe(true);
    await waitFor(() =>
      expect(mock.SmartOtp.startSmsRetriever).toHaveBeenCalled()
    );
  });

  it('emits a code extracted from a received SMS', async () => {
    const onCode = jest.fn();
    renderHook(() => useOtpAutofill({ length: 6, onCode }));
    await waitFor(() =>
      expect(mock.SmartOtp.addReceivedListener).toHaveBeenCalled()
    );
    act(() => mock.__fireReceived('Code: 778899'));
    expect(onCode).toHaveBeenCalledWith('778899');
  });

  it('emits a code detected on the clipboard via an injected reader', async () => {
    const onCode = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('Your code is 112233');
    renderHook(() =>
      useOtpAutofill({ length: 6, onCode, sms: false, getClipboardString })
    );
    await waitFor(() => expect(onCode).toHaveBeenCalledWith('112233'));
  });

  it('does not arm SMS when sms is disabled', async () => {
    renderHook(() =>
      useOtpAutofill({ length: 6, onCode: jest.fn(), sms: false })
    );
    // Give effects a chance to run.
    await waitFor(() =>
      expect(mock.SmartOtp.addReceivedListener).not.toHaveBeenCalled()
    );
    expect(mock.SmartOtp.startSmsRetriever).not.toHaveBeenCalled();
  });

  it('honors the user-consent SMS config', async () => {
    renderHook(() =>
      useOtpAutofill({
        length: 4,
        onCode: jest.fn(),
        sms: { method: 'userConsent', senderPhoneNumber: '+1555' },
      })
    );
    await waitFor(() =>
      expect(mock.SmartOtp.startSmsUserConsent).toHaveBeenCalledWith('+1555')
    );
  });
});
