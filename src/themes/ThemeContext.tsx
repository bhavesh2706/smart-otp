import React, { createContext, useContext, useMemo } from 'react';
import type { SmartOTPTheme } from './defaultTheme';
import type { SmartOTPLabelsInput } from '../utils/labels';

/**
 * Context carrying a shared {@link SmartOTPTheme}. `null` means "no provider" —
 * components then fall back to the built-in light/dark theme.
 */
const SmartOTPThemeContext = createContext<SmartOTPTheme | null>(null);

/**
 * Context carrying shared label overrides (i18n). `null` means "no provider".
 */
const SmartOTPLabelsContext = createContext<SmartOTPLabelsInput | null>(null);

/**
 * Props for {@link SmartOTPProvider}.
 */
export interface SmartOTPProviderProps {
  /** Theme applied to all descendant `SmartOTPInput`s (unless they override it). */
  readonly theme?: SmartOTPTheme;
  /** Label overrides (i18n) applied to all descendants (per-input `labels` wins). */
  readonly labels?: SmartOTPLabelsInput;
  readonly children: React.ReactNode;
}

/**
 * Provide a theme and/or localized labels to every `SmartOTPInput` below, so
 * apps configure styling and strings once instead of per-input. A `theme` or
 * `labels` prop on an individual input still wins.
 *
 * @example
 * ```tsx
 * <SmartOTPProvider
 *   theme={getMinimalTheme('dark')}
 *   labels={{ errorAnnouncement: 'Code incorrect' }}
 * >
 *   <App />
 * </SmartOTPProvider>
 * ```
 */
export function SmartOTPProvider({
  theme,
  labels,
  children,
}: SmartOTPProviderProps): React.ReactElement {
  // Identity-stable unless the value objects themselves change.
  const themeValue = useMemo(() => theme ?? null, [theme]);
  const labelsValue = useMemo(() => labels ?? null, [labels]);
  return (
    <SmartOTPThemeContext.Provider value={themeValue}>
      <SmartOTPLabelsContext.Provider value={labelsValue}>
        {children}
      </SmartOTPLabelsContext.Provider>
    </SmartOTPThemeContext.Provider>
  );
}

/**
 * Read the nearest provided {@link SmartOTPTheme}, or `null` when no
 * {@link SmartOTPProvider} supplies one.
 */
export function useSmartOTPTheme(): SmartOTPTheme | null {
  return useContext(SmartOTPThemeContext);
}

/**
 * Read the nearest provided label overrides, or `null` when none are supplied.
 */
export function useSmartOTPLabels(): SmartOTPLabelsInput | null {
  return useContext(SmartOTPLabelsContext);
}
