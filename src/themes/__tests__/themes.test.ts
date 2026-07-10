import {
  createTheme,
  getDefaultTheme,
  getFilledTheme,
  getMinimalTheme,
  getOutlinedTheme,
  resolveTheme,
} from '../defaultTheme';

describe('createTheme', () => {
  it('overrides top-level fields and shallow-merges colors', () => {
    const theme = createTheme(getOutlinedTheme('light'), {
      fontFamily: 'Inter-SemiBold',
      fontWeight: undefined,
      cellSize: 56,
      colors: { borderFocused: '#7C3AED' },
    });
    expect(theme.fontFamily).toBe('Inter-SemiBold');
    expect(theme.fontWeight).toBeUndefined();
    expect(theme.cellSize).toBe(56);
    // Overridden color replaced…
    expect(theme.colors.borderFocused).toBe('#7C3AED');
    // …other colors preserved.
    expect(theme.colors.text).toBe(getOutlinedTheme('light').colors.text);
  });
});

describe('built-in themes', () => {
  it('default/outlined is the box variant', () => {
    expect(getDefaultTheme().variant).toBe('box');
    expect(getOutlinedTheme).toBe(getDefaultTheme);
  });

  it('filled and minimal use their variants', () => {
    expect(getFilledTheme().variant).toBe('filled');
    expect(getMinimalTheme().variant).toBe('underline');
    expect(getMinimalTheme().cellRadius).toBe(0);
  });

  it('resolves dark-scheme colors', () => {
    const light = getDefaultTheme('light');
    const dark = getDefaultTheme('dark');
    expect(dark.colors.background).not.toBe(light.colors.background);
    expect(dark.colors.borderSuccess).toBeDefined();
    expect(dark.colors.surface).toBeDefined();
  });

  it('leaves the fine-grained tokens optional (undefined) by default', () => {
    const t = getDefaultTheme('light');
    expect(t.disabledOpacity).toBeUndefined();
    expect(t.cursorWidth).toBeUndefined();
    expect(t.contentGap).toBeUndefined();
    expect(t.colors.cursor).toBeUndefined();
  });
});

describe('resolveTheme', () => {
  it('returns a static theme unchanged', () => {
    const theme = getFilledTheme('dark');
    expect(resolveTheme(theme, 'light')).toBe(theme);
  });

  it('returns undefined for undefined / null input', () => {
    expect(resolveTheme(undefined, 'light')).toBeUndefined();
    expect(resolveTheme(null, 'dark')).toBeUndefined();
  });

  it('calls a resolver with the active scheme', () => {
    const resolver = jest.fn((scheme: 'light' | 'dark') =>
      getOutlinedTheme(scheme)
    );
    const dark = resolveTheme(resolver, 'dark');
    expect(resolver).toHaveBeenCalledWith('dark');
    expect(dark).toStrictEqual(getOutlinedTheme('dark'));
  });

  it('picks the matching half of a { light, dark } pair', () => {
    const pair = {
      light: getMinimalTheme('light'),
      dark: getFilledTheme('dark'),
    };
    expect(resolveTheme(pair, 'light')).toBe(pair.light);
    expect(resolveTheme(pair, 'dark')).toBe(pair.dark);
  });

  it('does not mistake a static theme (which has colors) for a pair', () => {
    // A theme object also has top-level keys, but `resolveTheme` must return it
    // as-is rather than treating any object as a pair.
    const theme = getFilledTheme('light');
    expect(resolveTheme(theme, 'dark')).toBe(theme);
  });
});
