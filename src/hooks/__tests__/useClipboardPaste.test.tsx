import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useClipboardPaste } from '../useClipboardPaste';

describe('useClipboardPaste', () => {
  it('reports unsupported and stays inert without a reader', async () => {
    const onDetect = jest.fn();
    const { result } = await renderHook(() =>
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
    await renderHook(() =>
      useClipboardPaste({ length: 6, onDetect, getClipboardString })
    );
    await waitFor(() => expect(onDetect).toHaveBeenCalledWith('654321'));
  });

  it('re-applies the same code on an explicit check (re-fill after clear)', async () => {
    // Reported bug: copy a code, Check → fills; Clear; copy the same code,
    // Check again → must re-fill. The manual `check` bypasses dedup.
    const onDetect = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('123456');
    const { result } = await renderHook(() =>
      useClipboardPaste({ length: 6, onDetect, getClipboardString })
    );
    await waitFor(() => expect(onDetect).toHaveBeenCalledTimes(1)); // mount
    await act(async () => {
      result.current.check();
    });
    expect(onDetect).toHaveBeenCalledTimes(2); // explicit re-check re-fires
    expect(onDetect).toHaveBeenLastCalledWith('123456');
  });

  it('does nothing when disabled', async () => {
    const onDetect = jest.fn();
    const getClipboardString = jest
      .fn<Promise<string>, []>()
      .mockResolvedValue('123456');
    await renderHook(() =>
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
    await renderHook(() =>
      useClipboardPaste({ length: 6, onDetect, getClipboardString })
    );
    await waitFor(() => expect(getClipboardString).toHaveBeenCalled());
    expect(onDetect).not.toHaveBeenCalled();
  });
});
