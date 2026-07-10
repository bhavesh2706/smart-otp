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

  it('initializes at duration and idle', async () => {
    const { result } = await renderHook(() => useCountdown({ duration: 30 }));
    expect(result.current.timeLeft).toBe(30);
    expect(result.current.isRunning).toBe(false);
  });

  it('ticks down once per second when started', async () => {
    const { result } = await renderHook(() => useCountdown({ duration: 3 }));
    await act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);
    await act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(2);
    await act(() => jest.advanceTimersByTime(2000));
    expect(result.current.timeLeft).toBe(0);
  });

  it('calls onExpire exactly once at zero and stops', async () => {
    const onExpire = jest.fn();
    const { result } = await renderHook(() =>
      useCountdown({ duration: 2, onExpire })
    );
    await act(() => result.current.start());
    await act(() => jest.advanceTimersByTime(2000));
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(result.current.isRunning).toBe(false);
    await act(() => jest.advanceTimersByTime(5000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('pauses and resumes from the same time', async () => {
    const { result } = await renderHook(() => useCountdown({ duration: 10 }));
    await act(() => result.current.start());
    await act(() => jest.advanceTimersByTime(3000));
    expect(result.current.timeLeft).toBe(7);
    await act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);
    await act(() => jest.advanceTimersByTime(5000));
    expect(result.current.timeLeft).toBe(7);
  });

  it('reset returns to duration and stops', async () => {
    const { result } = await renderHook(() => useCountdown({ duration: 10 }));
    await act(() => result.current.start());
    await act(() => jest.advanceTimersByTime(4000));
    await act(() => result.current.reset());
    expect(result.current.timeLeft).toBe(10);
    expect(result.current.isRunning).toBe(false);
  });

  it('auto-starts when requested', async () => {
    const { result } = await renderHook(() =>
      useCountdown({ duration: 5, autoStart: true })
    );
    expect(result.current.isRunning).toBe(true);
    await act(() => jest.advanceTimersByTime(1000));
    expect(result.current.timeLeft).toBe(4);
  });

  it('clears the interval on unmount', async () => {
    const clearSpy = jest.spyOn(global, 'clearInterval');
    const { result, unmount } = await renderHook(() =>
      useCountdown({ duration: 5 })
    );
    await act(() => result.current.start());
    await unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
