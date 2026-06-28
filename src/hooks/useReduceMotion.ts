import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Track the OS "Reduce Motion" accessibility setting.
 *
 * Returns `true` when the user has asked for reduced motion, so callers can skip
 * non-essential animations. Updates live if the setting changes while the app
 * is running.
 *
 * @example
 * ```tsx
 * const reduceMotion = useReduceMotion();
 * if (!reduceMotion) shake();
 * ```
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        // Querying the setting can fail on some platforms; default to motion on.
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
