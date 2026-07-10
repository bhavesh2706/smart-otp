import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { themeDefaults } from '../themes/tokens';

/**
 * Props for {@link Cursor}.
 */
export interface CursorProps {
  /** Caret color. */
  readonly color: string;
  /** Caret height in density-independent pixels. */
  readonly height: number;
  /** Caret width in dp. Defaults to {@link themeDefaults.cursorWidth}. */
  readonly width?: number;
  /** Caret corner radius in dp. Defaults to {@link themeDefaults.cursorRadius}. */
  readonly radius?: number;
  /** Fade duration per half-blink (ms). Defaults to `450`. */
  readonly blinkDuration?: number;
  /** Hold time before fading out (ms). Defaults to `250`. */
  readonly blinkDelay?: number;
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
  width = themeDefaults.cursorWidth,
  radius = themeDefaults.cursorRadius,
  blinkDuration = themeDefaults.cursorBlinkDuration,
  blinkDelay = themeDefaults.cursorBlinkDelay,
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
          duration: blinkDuration,
          delay: blinkDelay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: blinkDuration,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, animate, blinkDuration, blinkDelay]);

  return (
    <Animated.View
      style={{
        opacity,
        width,
        height,
        backgroundColor: color,
        borderRadius: radius,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
