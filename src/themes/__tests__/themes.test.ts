import {
  createTheme,
  getDefaultTheme,
  getFilledTheme,
  getMinimalTheme,
  getOutlinedTheme,
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
});
