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
 * The Outlined (box) theme — a full border on every side. This is the default.
 *
 * @param scheme - `'light'` or `'dark'`. Defaults to `'light'`.
 */
export function getDefaultTheme(scheme: ColorScheme = 'light'): SmartOTPTheme {
  return {
    variant: 'box',
    cellSize: 48,
    cellGap: spacing.sm,
    cellRadius: radius.md,
    cellBorderWidth: 1.5,
    fontSize: typography.cellFontSize,
    fontWeight: typography.cellFontWeight,
    colors: baseColors(scheme),
  };
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
  return {
    variant: 'filled',
    cellSize: 48,
    cellGap: spacing.sm,
    cellRadius: radius.sm,
    cellBorderWidth: 2,
    fontSize: typography.cellFontSize,
    fontWeight: typography.cellFontWeight,
    colors: baseColors(scheme),
  };
}

/**
 * The Minimal (underline) theme — a single bottom border, no box or fill.
 *
 * @param scheme - `'light'` or `'dark'`. Defaults to `'light'`.
 */
export function getMinimalTheme(scheme: ColorScheme = 'light'): SmartOTPTheme {
  return {
    variant: 'underline',
    cellSize: 44,
    cellGap: spacing.md,
    cellRadius: 0,
    cellBorderWidth: 2,
    fontSize: typography.cellFontSize,
    fontWeight: typography.cellFontWeight,
    colors: baseColors(scheme),
  };
}

/**
 * Partial overrides for {@link createTheme}. Top-level fields are optional and
 * `colors` may be a partial subset — only the keys you pass are replaced.
 */
export interface SmartOTPThemeOverrides
  extends Partial<Omit<SmartOTPTheme, 'colors'>> {
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
