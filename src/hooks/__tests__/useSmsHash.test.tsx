import { act, renderHook, waitFor } from '@testing-library/react-native';

jest.mock('../../native/SmartOtpModule');

import { useSmsHash } from '../useSmsHash';
import type * as SmartOtpModuleMock from '../../native/__mocks__/SmartOtpModule';

const mock = jest.requireMock(
  '../../native/SmartOtpModule'
) as typeof SmartOtpModuleMock;

describe('useSmsHash', () => {
  beforeEach(() => {
    mock.__reset();
  });

  it('resolves the app hash on mount', async () => {
    const { result } = await renderHook(() => useSmsHash());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hash).toBe('ABCDEFGHIJK');
    expect(result.current.hashes).toEqual(['ABCDEFGHIJK']);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error without throwing', async () => {
    mock.SmartOtp.getAppHash.mockRejectedValueOnce(new Error('no module'));
    const { result } = await renderHook(() => useSmsHash());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hash).toBeNull();
    expect(result.current.error?.message).toBe('no module');
  });

  it('re-computes on refresh', async () => {
    const { result } = await renderHook(() => useSmsHash());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mock.SmartOtp.getAppHash).toHaveBeenCalledTimes(1);
    act(() => result.current.refresh());
    await waitFor(() =>
      expect(mock.SmartOtp.getAppHash).toHaveBeenCalledTimes(2)
    );
  });
});
