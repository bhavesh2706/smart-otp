import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { Cursor } from './Cursor';
import type { SmartOTPTheme } from '../themes/defaultTheme';
import type { OTPCellState } from '../utils/types';

/**
 * Props for a single, fully-presentational OTP cell.
 *
 * `OTPCell` holds no logic and no state. It receives a resolved character and
 * a {@link OTPCellState} and renders accordingly, which keeps it cheap to
 * memoize and trivial to test in isolation.
 */
export interface OTPCellProps {
  /** The character to display, or `''` when the cell is empty. */
  readonly char: string;
  /** Resolved visual state used to pick border/background styling. */
  readonly state: OTPCellState;
  /** Placeholder glyph shown when `char` is empty. */
  readonly placeholder?: string;
  /** Color used for the placeholder glyph. Falls back to the theme. */
  readonly placeholderTextColor?: string;
  /** When `true`, the character is masked with a bullet (secure entry). */
  readonly mask?: boolean;
  /** Glyph used when `mask` is enabled. Defaults to `'●'`. */
  readonly maskSymbol?: string;
  /** Active theme supplying sizing and colors. */
  readonly theme: SmartOTPTheme;
  /** Base style override applied to every cell. */
  readonly cellStyle?: ViewStyle;
  /** Style override applied when the cell is focused. */
  readonly cellFocusedStyle?: ViewStyle;
  /** Style override applied when the cell is filled. */
  readonly cellFilledStyle?: ViewStyle;
  /** Style override applied when the input is in an error state. */
  readonly cellErrorStyle?: ViewStyle;
  /** Style override applied when the input is in a success state. */
  readonly cellSuccessStyle?: ViewStyle;
  /** Style override applied to the digit text. */
  readonly textStyle?: TextStyle;
  /** Whether the digit text may scale with the OS Dynamic Type setting. */
  readonly allowFontScaling?: boolean;
  /** Render a blinking caret in this cell (it is the active cell). */
  readonly caret?: boolean;
  /** Animate the caret blink. Pass `false` to keep it steady (reduce motion). */
  readonly caretAnimate?: boolean;
  /** Accessibility label, e.g. `"Digit 1 of 6, empty"`. */
  readonly accessibilityLabel: string;
}

function resolveBorderColor(state: OTPCellState, theme: SmartOTPTheme): string {
  switch (state) {
    case 'error':
      return theme.colors.borderError;
    case 'success':
      return theme.colors.borderSuccess;
    case 'focused':
      return theme.colors.borderFocused;
    case 'filled':
      return theme.colors.borderFilled;
    case 'disabled':
    case 'empty':
      return theme.colors.border;
    default: {
      // Exhaustiveness guard: a new OTPCellState must be handled above.
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

/**
 * Resolve the box-model styling for a cell variant. `'box'` borders every side;
 * `'underline'` only the bottom edge; `'filled'` uses a surface background with
 * an emphasized bottom border.
 */
function resolveVariantStyle(
  theme: SmartOTPTheme,
  borderColor: string
): ViewStyle {
  const variant = theme.variant ?? 'box';
  switch (variant) {
    case 'underline':
      return {
        borderBottomWidth: theme.cellBorderWidth,
        borderColor,
        backgroundColor: 'transparent',
      };
    case 'filled':
      return {
        borderBottomWidth: theme.cellBorderWidth,
        borderColor,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.cellRadius,
        borderTopRightRadius: theme.cellRadius,
      };
    case 'box':
      return {
        borderWidth: theme.cellBorderWidth,
        borderColor,
        backgroundColor: theme.colors.background,
        borderRadius: theme.cellRadius,
      };
    default: {
      const exhaustive: never = variant;
      return exhaustive;
    }
  }
}

const OTPCellComponent = ({
  char,
  state,
  placeholder,
  placeholderTextColor,
  mask = false,
  maskSymbol = '●',
  theme,
  cellStyle,
  cellFocusedStyle,
  cellFilledStyle,
  cellErrorStyle,
  cellSuccessStyle,
  textStyle,
  allowFontScaling = true,
  caret = false,
  caretAnimate = true,
  accessibilityLabel,
}: OTPCellProps): React.ReactElement => {
  const isEmpty = char.length === 0;

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      width: theme.cellSize,
      height: theme.cellSize,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: state === 'disabled' ? 0.5 : 1,
      ...resolveVariantStyle(theme, resolveBorderColor(state, theme)),
    }),
    [state, theme]
  );

  const digitStyle = useMemo<TextStyle>(() => {
    const base: TextStyle = {
      fontSize: theme.fontSize,
      color: isEmpty
        ? (placeholderTextColor ?? theme.colors.placeholder)
        : theme.colors.text,
      includeFontPadding: false,
      textAlign: 'center',
    };
    // Apply font family / weight only when set. With custom fonts on iOS,
    // `fontWeight` does not switch the typeface — use a weighted `fontFamily`
    // (e.g. "Inter-SemiBold") and leave `fontWeight` undefined.
    if (theme.fontFamily) {
      base.fontFamily = theme.fontFamily;
    }
    if (theme.fontWeight) {
      base.fontWeight = theme.fontWeight;
    }
    return base;
  }, [isEmpty, placeholderTextColor, theme]);

  const display = isEmpty ? (placeholder ?? '') : mask ? maskSymbol : char;

  return (
    <View
      style={[
        containerStyle,
        cellStyle,
        state === 'filled' && cellFilledStyle,
        state === 'focused' && cellFocusedStyle,
        state === 'error' && cellErrorStyle,
        state === 'success' && cellSuccessStyle,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility="yes"
    >
      <View style={styles.content}>
        {!isEmpty || !caret ? (
          <Text
            style={[digitStyle, textStyle]}
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={1.4}
            // Cells must never split a single glyph across lines.
            numberOfLines={1}
            importantForAccessibility="no"
          >
            {display}
          </Text>
        ) : null}
        {caret ? (
          <Cursor
            color={theme.colors.borderFocused}
            height={theme.fontSize * 1.1}
            animate={caretAnimate}
          />
        ) : null}
      </View>
    </View>
  );
};

OTPCellComponent.displayName = 'OTPCell';

const styles = StyleSheet.create({
  // Lays out the digit and the caret side by side and centered, so an active
  // filled cell shows both "5|" while an empty active cell shows just the caret.
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 2,
  },
});

/**
 * Memoized single OTP cell. Re-renders only when one of its props changes,
 * so typing into cell N never re-renders cells 1..N-1.
 *
 * @see {@link SmartOTPInput} for the orchestrating component.
 */
export const OTPCell = memo(OTPCellComponent);
