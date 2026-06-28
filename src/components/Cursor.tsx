import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Props for {@link Cursor}.
 */
export interface CursorProps {
  /** Caret color. */
  readonly color: string;
  /** Caret height in density-independent pixels. */
  readonly height: number;
  /**
   * Animate the blink. Pass `false` (e.g. when "Reduce Motion" is on) to render
   * a steady, non-blinking caret.
   */
  readonly animate?: boolean;
}

/**
 * A blinking text caret rendered inside the active OTP cell.
 *
 * The real `TextInput` caret is hidden (the input is visually empty), so this
 * standalone caret shows the user which cell the next keystroke will fill or
 * overwrite. The blink runs on the native driver (opacity only) and is fully
 * decorative — it is hidden from assistive technology.
 */
export function Cursor({
  color,
  height,
  animate = true,
}: CursorProps): React.ReactElement {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) {
      opacity.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 450,
          delay: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, animate]);

  return (
    <Animated.View
      style={{
        opacity,
        width: 2,
        height,
        backgroundColor: color,
        borderRadius: 1,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
