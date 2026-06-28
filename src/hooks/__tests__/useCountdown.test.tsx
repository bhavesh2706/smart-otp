import { act, renderHook } from '@testing-library/react-native';
import { useCountdown } from '../useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('initializes at duration and idle', () => {
    const { result } = renderHook(() => useCountdown({ duration: 30 }));
    expect(result.current.timeLeft).toBe(30);
    expect(result.current.isRunning).toBe(false);
  });

  it('ticks down once per second when started', () => {
    const { result } = renderHook(() => useCountdown({ duration: 3 }));
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(2);
    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.timeLeft).toBe(0);
  });

  it('calls onExpire exactly once at zero and stops', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() =>
      useCountdown({ duration: 2, onExpire })
    );
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(2000));
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
    act(() => jest.advanceTimersByTime(5000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('pauses and resumes from the same time', () => {
    const { result } = renderHook(() => useCountdown({ duration: 10 }));
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(3000));
    expect(result.current.timeLeft).toBe(7);
    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.timeLeft).toBe(7);
  });

  it('reset returns to duration and stops', () => {
    const { result } = renderHook(() => useCountdown({ duration: 10 }));
    act(() => result.current.start());
    act(() => jest.advanceTimersByTime(4000));
    act(() => result.current.reset());
    expect(result.current.timeLeft).toBe(10);
    expect(result.current.isRunning).toBe(false);
  });

  it('auto-starts when requested', () => {
    const { result } = renderHook(() =>
      useCountdown({ duration: 5, autoStart: true })
    );
    expect(result.current.isRunning).toBe(true);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(4);
  });

  it('clears the interval on unmount', () => {
    const clearSpy = jest.spyOn(global, 'clearInterval');
    const { result, unmount } = renderHook(() => useCountdown({ duration: 5 }));
    act(() => result.current.start());
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
