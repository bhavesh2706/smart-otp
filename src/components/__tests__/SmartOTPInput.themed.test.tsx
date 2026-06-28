import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { SmartOTPInput } from '../SmartOTPInput';
import type { OTPCellRenderInfo } from '../SmartOTPInput';
import { SmartOTPProvider } from '../../themes/ThemeContext';
import { getMinimalTheme } from '../../themes/defaultTheme';

describe('SmartOTPInput theming & custom cells', () => {
  it('renders a custom cell per slot via renderCell', () => {
    const renderCell = (info: OTPCellRenderInfo) => (
      <Text testID={`cell-${info.index}`}>{info.char || '_'}</Text>
    );
    const { getAllByText, getByTestId } = render(
      <SmartOTPInput length={4} value="12" renderCell={renderCell} />
    );
    const opts = { includeHiddenElements: true };
    expect(getByTestId('cell-0', opts)).toBeTruthy();
    expect(getByTestId('cell-3', opts)).toBeTruthy();
    // Two empty cells render the '_' fallback.
    expect(getAllByText('_', opts)).toHaveLength(2);
  });

  it('passes the success state through to renderCell', () => {
    let captured: OTPCellRenderInfo | null = null;
    const renderCell = (info: OTPCellRenderInfo) => {
      if (info.index === 0) {
        captured = info;
      }
      return <Text testID={`cell-${info.index}`}>{info.char}</Text>;
    };
    render(
      <SmartOTPInput length={4} value="1234" success renderCell={renderCell} />
    );
    expect(captured).not.toBeNull();
    expect(captured!.state).toBe('success');
  });

  it('passes the error state through to renderCell', () => {
    let state: string | undefined;
    render(
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

  it('renders within a SmartOTPProvider without error', () => {
    const { getByTestId } = render(
      <SmartOTPProvider theme={getMinimalTheme('dark')}>
        <SmartOTPInput length={6} testID="themed-input" />
      </SmartOTPProvider>
    );
    expect(getByTestId('themed-input')).toBeTruthy();
  });

  it('applies provider labels app-wide; per-input labels win', () => {
    const { getByTestId } = render(
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
