import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Options for {@link useOtpFeedback}.
 */
export interface UseOtpFeedbackOptions {
  /** When this transitions to `true`, the cells shake horizontally. */
  readonly error: boolean;
  /** When this transitions to `true`, the cells "pop" (a brief scale up). */
  readonly success: boolean;
  /**
   * Master gate. Pass `false` to disable all motion (e.g. when the component's
   * `animated` prop is off or the OS "Reduce Motion" setting is on).
   */
  readonly enabled: boolean;
}

/**
 * Result of {@link useOtpFeedback}: an animated transform style to spread onto
 * the cell container.
 */
export interface UseOtpFeedbackResult {
  readonly style: {
    readonly transform: [
      { readonly translateX: Animated.Value },
      { readonly scale: Animated.Value },
    ];
  };
}

const SHAKE_OFFSET = 8;

/**
 * Drives the error-shake and success-pop micro-animations for `SmartOTPInput`.
 *
 * Both animations run on the native driver (transform only), so they stay on the
 * UI thread and never block JS. Each fires only on the rising edge of its state
 * — re-rendering while `error`/`success` stay `true` does not re-trigger it.
 * When `enabled` is `false` the values are snapped without animating.
 */
export function useOtpFeedback({
  error,
  success,
  enabled,
}: UseOtpFeedbackOptions): UseOtpFeedbackResult {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const prevError = useRef(error);
  const prevSuccess = useRef(success);

  useEffect(() => {
    const rising = error && !prevError.current;
    prevError.current = error;
    if (!rising) {
      return;
    }
    if (!enabled) {
      translateX.setValue(0);
      return;
    }
    Animated.sequence([
      Animated.timing(translateX, {
        toValue: -SHAKE_OFFSET,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: SHAKE_OFFSET,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -SHAKE_OFFSET / 2,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [error, enabled, translateX]);

  useEffect(() => {
    const rising = success && !prevSuccess.current;
    prevSuccess.current = success;
    if (!rising) {
      return;
    }
    if (!enabled) {
      scale.setValue(1);
      return;
    }
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.06,
        useNativeDriver: true,
        speed: 50,
        bounciness: 12,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 8,
      }),
    ]).start();
  }, [success, enabled, scale]);

  return {
    style: { transform: [{ translateX }, { scale }] },
  };
}
