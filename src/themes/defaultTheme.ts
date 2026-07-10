import type { TextStyle } from 'react-native';
import { palette, radius, spacing, typography } from './tokens';
import type { ColorScheme } from './tokens';

/**
 * Visual variant of the cells:
 *
 * - `'box'` — full border on all sides (Outlined). The default.
 * - `'filled'` — filled surface background with an emphasized bottom border
 *   (Material text-field style).
 * - `'underline'` — bottom border only, no box or background (Minimal).
 */
export type SmartOTPVariant = 'box' | 'filled' | 'underline';

/**
 * A fully-resolved style description consumed by the cells. Components read a
 * {@link SmartOTPTheme} rather than raw tokens, so custom and built-in themes
 * are drop-in compatible.
 */
export interface SmartOTPTheme {
  /** Cell rendering variant. Optional; treated as `'box'` when omitted. */
  readonly variant?: SmartOTPVariant;
  readonly cellSize: number;
  readonly cellGap: number;
  readonly cellRadius: number;
  readonly cellBorderWidth: number;
  readonly fontSize: number;
  /**
   * Digit font family. Use this for custom fonts — on iOS a custom typeface's
   * weight is selected by the family name (e.g. `"Inter-SemiBold"`), not by
   * {@link SmartOTPTheme.fontWeight}.
   */
  readonly fontFamily?: string;
  /**
   * Digit font weight. Applied only when set. Reliable with the system font;
   * with custom fonts on iOS prefer a weighted {@link SmartOTPTheme.fontFamily}
   * and leave this `undefined`.
   */
  readonly fontWeight?: TextStyle['fontWeight'];
  /**
   * Cell opacity while `disabled`. Optional; defaults to
   * {@link themeDefaults.disabledOpacity}.
   */
  readonly disabledOpacity?: number;
  /**
   * Cell-row opacity while a verification is in flight. Optional; defaults to
   * {@link themeDefaults.loadingOpacity}.
   */
  readonly loadingOpacity?: number;
  /** Blinking-caret width in dp. Optional; defaults to `2`. */
  readonly cursorWidth?: number;
  /** Blinking-caret corner radius in dp. Optional; defaults to `1`. */
  readonly cursorRadius?: number;
  /** Caret height as a multiple of `fontSize`. Optional; defaults to `1.1`. */
  readonly cursorHeightRatio?: number;
  /** Caret fade duration per half-blink (ms). Optional; defaults to `450`. */
  readonly cursorBlinkDuration?: number;
  /** Caret hold before fading out (ms). Optional; defaults to `250`. */
  readonly cursorBlinkDelay?: number;
  /** Gap between a filled digit and its caret in dp. Optional; defaults to `2`. */
  readonly contentGap?: number;
  /** Max Dynamic Type scale for the digit text. Optional; defaults to `1.4`. */
  readonly maxFontSizeMultiplier?: number;
  readonly colors: {
    readonly text: string;
    readonly placeholder: string;
    readonly background: string;
    /** Fill color used by the `'filled'` variant. */
    readonly surface: string;
    readonly border: string;
    readonly borderFocused: string;
    readonly borderFilled: string;
    readonly borderError: string;
    readonly borderSuccess: string;
    /** Blinking-caret color. Optional; defaults to `borderFocused`. */
    readonly cursor?: string;
    /** Loading-spinner color. Optional; defaults to `borderFocused`. */
    readonly spinner?: string;
  };
}

function baseColors(scheme: ColorScheme): SmartOTPTheme['colors'] {
  const c = palette[scheme];
  return {
    text: c.text,
    placeholder: c.placeholder,
    background: c.background,
    surface: c.surface,
    border: c.border,
    borderFocused: c.borderFocused,
    borderFilled: c.borderFilled,
    borderError: c.borderError,
    borderSuccess: c.borderSuccess,
  };
}

/**
 * Fields shared by every built-in theme. Each `get*Theme` builder overrides
 * only the handful of values that make its variant distinct, so the common
 * sizing/typography is stated once.
 */
type ThemeShape = Omit<SmartOTPTheme, 'colors'>;

const COMMON_THEME: ThemeShape = {
  variant: 'box',
  cellSize: 48,
  cellGap: spacing.sm,
  cellRadius: radius.md,
  cellBorderWidth: 1.5,
  fontSize: typography.cellFontSize,
  fontWeight: typography.cellFontWeight,
};

/** Build a theme from the shared base, applying a variant's overrides. */
function buildTheme(
  scheme: ColorScheme,
  overrides: Partial<ThemeShape>
): SmartOTPTheme {
  return { ...COMMON_THEME, ...overrides, colors: baseColors(scheme) };
}

/**
 * The Outlined (box) theme — a full border on every side. This is the default.
 *
 * @param scheme - `'light'` or `'dark'`. Defaults to `'light'`.
 */
export function getDefaultTheme(scheme: ColorScheme = 'light'): SmartOTPTheme {
  return buildTheme(scheme, { variant: 'box' });
}

/** Alias of {@link getDefaultTheme} for explicit Outlined styling. */
export const getOutlinedTheme = getDefaultTheme;

/**
 * The Material (filled) theme — a filled surface with an emphasized bottom
 * border, à la Material text fields.
 *
 * @param scheme - `'light'` or `'dark'`. Defaults to `'light'`.
 */
export function getFilledTheme(scheme: ColorScheme = 'light'): SmartOTPTheme {
  return buildTheme(scheme, {
    variant: 'filled',
    cellRadius: radius.sm,
    cellBorderWidth: 2,
  });
}

/**
 * The Minimal (underline) theme — a single bottom border, no box or fill.
 *
 * @param scheme - `'light'` or `'dark'`. Defaults to `'light'`.
 */
export function getMinimalTheme(scheme: ColorScheme = 'light'): SmartOTPTheme {
  return buildTheme(scheme, {
    variant: 'underline',
    cellSize: 44,
    cellGap: spacing.md,
    cellRadius: 0,
    cellBorderWidth: 2,
  });
}

/**
 * Partial overrides for {@link createTheme}. Top-level fields are optional and
 * `colors` may be a partial subset — only the keys you pass are replaced.
 */
export interface SmartOTPThemeOverrides extends Partial<
  Omit<SmartOTPTheme, 'colors'>
> {
  readonly colors?: Partial<SmartOTPTheme['colors']>;
}

/**
 * Build a theme by overriding any fields of a base theme, with a shallow merge
 * of `colors`. The one-call way to customize without restating the whole theme.
 *
 * @example Brand font + accent, on top of the dark Outlined theme
 * ```ts
 * const theme = createTheme(getOutlinedTheme('dark'), {
 *   fontFamily: 'Inter-SemiBold', // iOS-safe custom font
 *   fontWeight: undefined,        // let the family carry the weight
 *   cellSize: 56,
 *   colors: { borderFocused: '#7C3AED' },
 * });
 * ```
 */
export function createTheme(
  base: SmartOTPTheme,
  overrides: SmartOTPThemeOverrides
): SmartOTPTheme {
  return {
    ...base,
    ...overrides,
    colors: { ...base.colors, ...overrides.colors },
  };
}

/**
 * A function that returns the theme for a given color scheme. Use it to make a
 * custom theme follow the OS light/dark setting automatically.
 *
 * @example
 * ```tsx
 * <SmartOTPInput
 *   theme={(scheme) =>
 *     createTheme(getOutlinedTheme(scheme), {
 *       colors: { borderFocused: scheme === 'dark' ? '#8B5CF6' : '#7C3AED' },
 *     })
 *   }
 * />
 * ```
 */
export type SmartOTPThemeResolver = (scheme: ColorScheme) => SmartOTPTheme;

/** A pre-built pair of themes, one per color scheme. */
export interface SmartOTPThemePair {
  readonly light: SmartOTPTheme;
  readonly dark: SmartOTPTheme;
}

/**
 * Everything accepted by the `theme` prop / provider. Any of:
 *
 * - a static {@link SmartOTPTheme} (fixed colors, as before);
 * - a {@link SmartOTPThemeResolver} `(scheme) => theme` for full per-scheme control;
 * - a {@link SmartOTPThemePair} `{ light, dark }` for the simple two-theme case.
 *
 * The last two follow the OS color scheme automatically.
 */
export type SmartOTPThemeInput =
  SmartOTPTheme | SmartOTPThemeResolver | SmartOTPThemePair;

/** Type guard: a `{ light, dark }` pair (not a plain theme, which has `colors`). */
function isThemePair(input: object): input is SmartOTPThemePair {
  return 'light' in input && 'dark' in input && !('colors' in input);
}

/**
 * Resolve a {@link SmartOTPThemeInput} to a concrete {@link SmartOTPTheme} for
 * the active `scheme`. Returns `undefined` for `undefined` input so callers can
 * chain fallbacks (`resolveTheme(prop) ?? resolveTheme(ctx) ?? getDefaultTheme()`).
 */
export function resolveTheme(
  input: SmartOTPThemeInput | undefined | null,
  scheme: ColorScheme
): SmartOTPTheme | undefined {
  if (input == null) {
    return undefined;
  }
  if (typeof input === 'function') {
    return input(scheme);
  }
  if (isThemePair(input)) {
    return input[scheme];
  }
  return input;
}
