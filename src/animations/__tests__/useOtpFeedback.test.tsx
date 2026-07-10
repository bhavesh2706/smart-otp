import { Animated } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useOtpFeedback } from '../useOtpFeedback';

describe('useOtpFeedback', () => {
  it('returns a transform style with translateX and scale animated values', async () => {
    const { result } = await renderHook(() =>
      useOtpFeedback({ error: false, success: false, enabled: true })
    );
    const [tx, sc] = result.current.style.transform;
    expect(tx.translateX).toBeInstanceOf(Animated.Value);
    expect(sc.scale).toBeInstanceOf(Animated.Value);
  });

  it('keeps stable animated value identities across re-renders', async () => {
    // Motion disabled: identity comes from useRef and is independent of
    // `enabled`, and this avoids starting a real animation whose async timers
    // would outlive the test environment.
    const { result, rerender } = await renderHook(
      ({ error }: { error: boolean }) =>
        useOtpFeedback({ error, success: false, enabled: false }),
      { initialProps: { error: false } }
    );
    const first = result.current.style.transform[0].translateX;
    await rerender({ error: true });
    expect(result.current.style.transform[0].translateX).toBe(first);
  });

  it('does not throw when triggering with motion disabled', async () => {
    const { rerender } = await renderHook(
      ({ error, success }: { error: boolean; success: boolean }) =>
        useOtpFeedback({ error, success, enabled: false }),
      { initialProps: { error: false, success: false } }
    );
    await expect(
      (async () => {
        await rerender({ error: true, success: false });
        await rerender({ error: false, success: true });
      })()
    ).resolves.toBeUndefined();
  });
});
