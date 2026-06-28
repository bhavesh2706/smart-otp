import { Animated } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useOtpFeedback } from '../useOtpFeedback';

describe('useOtpFeedback', () => {
  it('returns a transform style with translateX and scale animated values', () => {
    const { result } = renderHook(() =>
      useOtpFeedback({ error: false, success: false, enabled: true })
    );
    const [tx, sc] = result.current.style.transform;
    expect(tx.translateX).toBeInstanceOf(Animated.Value);
    expect(sc.scale).toBeInstanceOf(Animated.Value);
  });

  it('keeps stable animated value identities across re-renders', () => {
    // Motion disabled: identity comes from useRef and is independent of
    // `enabled`, and this avoids starting a real animation whose async timers
    // would outlive the test environment.
    const { result, rerender } = renderHook(
      ({ error }) => useOtpFeedback({ error, success: false, enabled: false }),
      { initialProps: { error: false } }
    );
    const first = result.current.style.transform[0].translateX;
    rerender({ error: true });
    expect(result.current.style.transform[0].translateX).toBe(first);
  });

  it('does not throw when triggering with motion disabled', () => {
    const { rerender } = renderHook(
      ({ error, success }) =>
        useOtpFeedback({ error, success, enabled: false }),
      { initialProps: { error: false, success: false } }
    );
    expect(() => {
      rerender({ error: true, success: false });
      rerender({ error: false, success: true });
    }).not.toThrow();
  });
});
