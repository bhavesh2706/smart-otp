import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useClipboardPaste } from '../useClipboardPaste';

describe('useClipboardPaste', () => {
  it('reports unsupported and stays inert without a reader', () => {
    const onDetect = jest.fn();
    const { result } = renderHook(() =>
      useClipboardPaste({ length: 6, onDetect })
    );
    // No optional clipboard module is installed in the test runtime.
    expect(result.current.isSupported).toBe(false);
    expect(onDetect).not.toHaveBeenCalled();
  });

  it('detects a code from the injected reader on mount', async () => {
    const onDetect = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('Your code is 654321');
    renderHook(() =>
      useClipboardPaste({ length: 6, onDetect, getClipboardString })
    );
    await waitFor(() => expect(onDetect).toHaveBeenCalledWith('654321'));
  });

  it('deduplicates automatic reads of identical clipboard contents', async () => {
    jest.useFakeTimers();
    const onDetect = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('123456');
    renderHook(() =>
      useClipboardPaste({
        length: 6,
        onDetect,
        getClipboardString,
        pollInterval: 1000,
      })
    );
    await waitFor(() => expect(onDetect).toHaveBeenCalledTimes(1));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() => expect(getClipboardString.mock.calls.length).toBeGreaterThan(1));
    expect(onDetect).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('manual check re-applies the same code', async () => {
    const onDetect = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('123456');
    const { result } = renderHook(() =>
      useClipboardPaste({ length: 6, onDetect, getClipboardString })
    );
    await waitFor(() => expect(onDetect).toHaveBeenCalledTimes(1));
    await act(async () => {
      result.current.check();
    });
    await waitFor(() => expect(onDetect).toHaveBeenCalledTimes(2));
    expect(onDetect).toHaveBeenNthCalledWith(2, '123456');
  });

  it('does nothing when disabled', () => {
    const onDetect = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('123456');
    renderHook(() =>
      useClipboardPaste({
        length: 6,
        onDetect,
        getClipboardString,
        enabled: false,
      })
    );
    expect(getClipboardString).not.toHaveBeenCalled();
    expect(onDetect).not.toHaveBeenCalled();
  });

  it('ignores clipboard text without an exact-length code', async () => {
    const onDetect = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('no code here, 12 only');
    renderHook(() =>
      useClipboardPaste({ length: 6, onDetect, getClipboardString })
    );
    await waitFor(() => expect(getClipboardString).toHaveBeenCalled());
    expect(onDetect).not.toHaveBeenCalled();
  });
});
