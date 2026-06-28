import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Options for {@link useCountdown}.
 */
export interface UseCountdownOptions {
  /** Countdown duration in **seconds**. Must be a non-negative integer. */
  readonly duration: number;
  /** Called once each time the countdown reaches zero. */
  readonly onExpire?: () => void;
  /** Start counting immediately on mount. Defaults to `false`. */
  readonly autoStart?: boolean;
}

/**
 * Return value of {@link useCountdown}.
 */
export interface UseCountdownResult {
  /** Seconds remaining. Starts at `duration`, ticks down to `0`. */
  readonly timeLeft: number;
  /** `true` while actively counting down. */
  readonly isRunning: boolean;
  /** Start (or restart) the countdown from `duration`. */
  readonly start: () => void;
  /** Pause at the current `timeLeft`. Resume with {@link start}. */
  readonly pause: () => void;
  /** Stop and reset `timeLeft` back to `duration`. */
  readonly reset: () => void;
}

/** One tick of the countdown, in milliseconds. */
const TICK_MS = 1000;

/**
 * A self-contained, leak-free countdown timer for resend / retry flows.
 *
 * The interval is cleared on pause, on expiry and on unmount, so no timer
 * outlives the component. `onExpire` is read through a ref, so passing an inline
 * arrow function never restarts the timer. When `duration` changes while the
 * timer is idle, `timeLeft` re-syncs to the new value.
 *
 * @example Resend button
 * ```tsx
 * const { timeLeft, isRunning, start } = useCountdown({
 *   duration: 30,
 *   autoStart: true,
 * });
 *
 * <Button
 *   title={isRunning ? `Resend in ${timeLeft}s` : 'Resend code'}
 *   disabled={isRunning}
 *   onPress={() => {
 *     resendCode();
 *     start();
 *   }}
 * />;
 * ```
 */
export function useCountdown({
  duration,
  onExpire,
  autoStart = false,
}: UseCountdownOptions): UseCountdownResult {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  // Tracks the running state for effects without making them depend on it.
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const prevDurationRef = useRef(duration);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setTimeLeft((current) => {
      if (current <= 1) {
        clear();
        setIsRunning(false);
        onExpireRef.current?.();
        return 0;
      }
      return current - 1;
    });
  }, [clear]);

  const start = useCallback(() => {
    clear();
    setTimeLeft(duration);
    if (duration <= 0) {
      setIsRunning(false);
      onExpireRef.current?.();
      return;
    }
    setIsRunning(true);
    intervalRef.current = setInterval(tick, TICK_MS);
  }, [clear, duration, tick]);

  const pause = useCallback(() => {
    clear();
    setIsRunning(false);
  }, [clear]);

  const reset = useCallback(() => {
    clear();
    setIsRunning(false);
    setTimeLeft(duration);
  }, [clear, duration]);

  // Auto-start once on mount when requested.
  useEffect(() => {
    if (autoStart) {
      start();
    }
    return clear;
    // Intentionally mount-only: re-running on `start`/`autoStart` identity
    // changes would restart the timer unexpectedly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-sync to a *changed* `duration` only — and only while idle. This must not
  // react to `isRunning` toggling false on pause/expiry, which would otherwise
  // wipe the remaining (paused) or final (expired) time back to `duration`.
  useEffect(() => {
    if (prevDurationRef.current !== duration) {
      prevDurationRef.current = duration;
      if (!isRunningRef.current) {
        setTimeLeft(duration);
      }
    }
  }, [duration]);

  return { timeLeft, isRunning, start, pause, reset };
}
