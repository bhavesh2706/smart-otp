import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SmartOTPInput } from '../SmartOTPInput';
import type { OTPCellRenderInfo } from '../SmartOTPInput';
import { SmartOTPProvider } from '../../themes/ThemeContext';
import {
  createTheme,
  getFilledTheme,
  getMinimalTheme,
  getOutlinedTheme,
} from '../../themes/defaultTheme';
import type { ColorScheme } from '../../themes/tokens';

describe('SmartOTPInput theming & custom cells', () => {
  it('renders a custom cell per slot via renderCell', async () => {
    const renderCell = (info: OTPCellRenderInfo) => (
      <Text testID={`cell-${info.index}`}>{info.char || '_'}</Text>
    );
    const { getAllByText, getByTestId } = await render(
      <SmartOTPInput length={4} value="12" renderCell={renderCell} />
    );
    const opts = { includeHiddenElements: true };
    expect(getByTestId('cell-0', opts)).toBeTruthy();
    expect(getByTestId('cell-3', opts)).toBeTruthy();
    // Two empty cells render the '_' fallback.
    expect(getAllByText('_', opts)).toHaveLength(2);
  });

  it('passes the success state through to renderCell', async () => {
    let captured: OTPCellRenderInfo | null = null;
    const renderCell = (info: OTPCellRenderInfo) => {
      if (info.index === 0) {
        captured = info;
      }
      return <Text testID={`cell-${info.index}`}>{info.char}</Text>;
    };
    await render(
      <SmartOTPInput length={4} value="1234" success renderCell={renderCell} />
    );
    expect(captured).not.toBeNull();
    expect(captured!.state).toBe('success');
  });

  it('passes the error state through to renderCell', async () => {
    let state: string | undefined;
    await render(
      <SmartOTPInput
        length={4}
        value="1234"
        error
        renderCell={(info) => {
          if (info.index === 0) {
            state = info.state;
          }
          return <Text testID={`c-${info.index}`}>{info.char}</Text>;
        }}
      />
    );
    expect(state).toBe('error');
  });

  it('renders within a SmartOTPProvider without error', async () => {
    const { getByTestId } = await render(
      <SmartOTPProvider theme={getMinimalTheme('dark')}>
        <SmartOTPInput length={6} testID="themed-input" />
      </SmartOTPProvider>
    );
    expect(getByTestId('themed-input')).toBeTruthy();
  });

  it('invokes a theme resolver with the active scheme', async () => {
    const resolver = jest.fn((scheme: ColorScheme) => getOutlinedTheme(scheme));
    await render(<SmartOTPInput length={4} theme={resolver} testID="r" />);
    // Test env `useColorScheme()` is null → resolves to 'light'.
    expect(resolver).toHaveBeenCalledWith('light');
  });

  it('accepts a { light, dark } theme pair', async () => {
    const { getByTestId } = await render(
      <SmartOTPInput
        length={4}
        theme={{
          light: getMinimalTheme('light'),
          dark: getFilledTheme('dark'),
        }}
        testID="pair"
      />
    );
    expect(getByTestId('pair')).toBeTruthy();
  });

  it('resolves a provider theme resolver per scheme', async () => {
    const resolver = jest.fn((scheme: ColorScheme) =>
      createTheme(getFilledTheme(scheme), { disabledOpacity: 0.2 })
    );
    await render(
      <SmartOTPProvider theme={resolver}>
        <SmartOTPInput length={4} testID="p" />
      </SmartOTPProvider>
    );
    expect(resolver).toHaveBeenCalledWith('light');
  });

  it('applies provider labels app-wide; per-input labels win', async () => {
    const { getByTestId } = await render(
      <SmartOTPProvider labels={{ input: () => 'Provider label' }}>
        <SmartOTPInput length={6} testID="a" />
        <SmartOTPInput
          length={6}
          labels={{ input: () => 'Per-input label' }}
          testID="b"
        />
      </SmartOTPProvider>
    );
    expect(getByTestId('a').props.accessibilityLabel).toBe('Provider label');
    expect(getByTestId('b').props.accessibilityLabel).toBe('Per-input label');
  });
});
