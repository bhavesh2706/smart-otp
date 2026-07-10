/**
 * Design tokens for react-native-smart-otp.
 *
 * Tokens are the single source of truth for color, spacing and typography.
 * Themes (Milestone 5) compose these tokens; the core component in Milestone 1
 * consumes {@link defaultTheme} only. Keeping tokens isolated from React Native
 * style objects means they can be reused on web or in tests with zero imports.
 *
 * @packageDocumentation
 */

/** Spacing scale in density-independent pixels. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
} as const;

/** Border radius scale. */
export const radius = {
  sm: 6,
  md: 10,
} as const;

/**
 * Color palette. Light and dark variants are provided so the component can
 * react to color scheme without each consumer redefining colors. Contrast
 * ratios for text-on-background meet WCAG AA (>= 4.5:1).
 */
export const palette = {
  light: {
    text: '#11181C',
    placeholder: '#9BA1A6',
    background: '#FFFFFF',
    surface: '#F1F3F5',
    border: '#D0D7DE',
    borderFocused: '#007AFF',
    borderError: '#D32F2F',
    borderSuccess: '#2E7D32',
    borderFilled: '#11181C',
  },
  dark: {
    text: '#ECEDEE',
    placeholder: '#687076',
    background: '#1C1F22',
    surface: '#2A2E33',
    border: '#3A4046',
    borderFocused: '#0A84FF',
    borderError: '#FF6B6B',
    borderSuccess: '#66BB6A',
    borderFilled: '#ECEDEE',
  },
} as const;

/** Typography scale for cell digits. */
export const typography = {
  cellFontSize: 22,
  cellFontWeight: '600',
} as const;

/**
 * Fallback values for the optional, fine-grained {@link SmartOTPTheme} tokens.
 * Every one of these can be overridden on a theme; when a token is omitted the
 * component reads the matching value here, so a minimal theme stays valid while
 * a fully-specified theme controls every pixel.
 */
export const themeDefaults = {
  /** Cell opacity while `disabled`. */
  disabledOpacity: 0.5,
  /** Cell-row opacity while a verification is loading. */
  loadingOpacity: 0.5,
  /** Blinking caret width (dp). */
  cursorWidth: 2,
  /** Blinking caret corner radius (dp). */
  cursorRadius: 1,
  /** Caret height as a multiple of `fontSize`. */
  cursorHeightRatio: 1.1,
  /** Caret fade duration per half-blink (ms). */
  cursorBlinkDuration: 450,
  /** Caret hold time before fading out (ms). */
  cursorBlinkDelay: 250,
  /** Horizontal gap between a filled digit and its caret (dp). */
  contentGap: 2,
  /** Max Dynamic Type scale factor applied to the digit text. */
  maxFontSizeMultiplier: 1.4,
} as const;

/** Convenience union of the supported color schemes. */
export type ColorScheme = keyof typeof palette;
