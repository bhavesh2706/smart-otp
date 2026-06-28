import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('../../native/SmartOtpModule');

import { useSmsRetriever } from '../useSmsRetriever';
import type * as SmartOtpModuleMock from '../../native/__mocks__/SmartOtpModule';

const mock = jest.requireMock(
  '../../native/SmartOtpModule'
) as typeof SmartOtpModuleMock;

describe('useSmsRetriever', () => {
  beforeEach(() => {
    mock.__reset();
  });

  it('reports supported and auto-starts the retriever', async () => {
    const { result } = renderHook(() =>
      useSmsRetriever({ length: 6, onReceived: jest.fn() })
    );
    expect(result.current.isSupported).toBe(true);
    await waitFor(() =>
      expect(mock.SmartOtp.startSmsRetriever).toHaveBeenCalledTimes(1)
    );
  });

  it('extracts the OTP from a received SMS body', async () => {
    const onReceived = jest.fn();
    renderHook(() => useSmsRetriever({ length: 6, onReceived }));
    await waitFor(() =>
      expect(mock.SmartOtp.addReceivedListener).toHaveBeenCalled()
    );
    act(() => mock.__fireReceived('Your code is 135790. Do not share.'));
    expect(onReceived).toHaveBeenCalledWith({
      message: 'Your code is 135790. Do not share.',
      otp: '135790',
    });
  });

  it('uses the user-consent flow when requested', async () => {
    renderHook(() =>
      useSmsRetriever({
        length: 4,
        onReceived: jest.fn(),
        method: 'userConsent',
        senderPhoneNumber: '+15551234567',
      })
    );
    await waitFor(() =>
      expect(mock.SmartOtp.startSmsUserConsent).toHaveBeenCalledWith(
        '+15551234567'
      )
    );
    expect(mock.SmartOtp.startSmsRetriever).not.toHaveBeenCalled();
  });

  it('forwards timeout and error events', async () => {
    const onTimeout = jest.fn();
    const onError = jest.fn();
    renderHook(() =>
      useSmsRetriever({ length: 6, onReceived: jest.fn(), onTimeout, onError })
    );
    await waitFor(() =>
      expect(mock.SmartOtp.addTimeoutListener).toHaveBeenCalled()
    );
    act(() => mock.__fireTimeout());
    expect(onTimeout).toHaveBeenCalledTimes(1);
    act(() => mock.__fireError('GMS failure'));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe('GMS failure');
  });

  it('stops and removes listeners on unmount', async () => {
    const { unmount } = renderHook(() =>
      useSmsRetriever({ length: 6, onReceived: jest.fn() })
    );
    await waitFor(() =>
      expect(mock.SmartOtp.addReceivedListener).toHaveBeenCalled()
    );
    unmount();
    expect(mock.SmartOtp.stop).toHaveBeenCalled();
  });

  it('is inert when unsupported', async () => {
    mock.__setSupported(false);
    const onReceived = jest.fn();
    const { result } = renderHook(() =>
      useSmsRetriever({ length: 6, onReceived })
    );
    expect(result.current.isSupported).toBe(false);
    const started = await result.current.start();
    expect(started).toBe(false);
    expect(mock.SmartOtp.startSmsRetriever).not.toHaveBeenCalled();
  });
});
