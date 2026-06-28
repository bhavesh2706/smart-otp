import type { TextStyle, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { OTPCell } from '../OTPCell';
import {
  createTheme,
  getDefaultTheme,
  getMinimalTheme,
} from '../../themes/defaultTheme';

const theme = getDefaultTheme('light');

function flatStyle(node: {
  props: { style?: unknown };
}): ViewStyle & TextStyle {
  return StyleSheet.flatten(node.props.style as ViewStyle & TextStyle) ?? {};
}

describe('OTPCell', () => {
  it('renders the character when filled', () => {
    const { getByText } = render(
      <OTPCell
        char="7"
        state="filled"
        theme={theme}
        accessibilityLabel="Digit 1 of 6, filled"
      />
    );
    expect(getByText('7')).toBeTruthy();
  });

  it('masks the character when mask is enabled', () => {
    const { getByText, queryByText } = render(
      <OTPCell
        char="7"
        state="filled"
        mask
        theme={theme}
        accessibilityLabel="Digit 1 of 6, filled"
      />
    );
    expect(queryByText('7')).toBeNull();
    expect(getByText('●')).toBeTruthy();
  });

  it('renders the placeholder when empty', () => {
    const { getByText } = render(
      <OTPCell
        char=""
        state="empty"
        placeholder="-"
        theme={theme}
        accessibilityLabel="Digit 1 of 6, empty"
      />
    );
    expect(getByText('-')).toBeTruthy();
  });

  it('exposes the accessibility label', () => {
    const { getByLabelText } = render(
      <OTPCell
        char=""
        state="empty"
        theme={theme}
        accessibilityLabel="Digit 2 of 4, empty"
      />
    );
    expect(getByLabelText('Digit 2 of 4, empty')).toBeTruthy();
  });

  it('uses the success border color in the success state', () => {
    const { getByLabelText } = render(
      <OTPCell
        char="1"
        state="success"
        theme={theme}
        accessibilityLabel="cell"
      />
    );
    expect(flatStyle(getByLabelText('cell')).borderColor).toBe(
      theme.colors.borderSuccess
    );
  });

  it('applies cellSuccessStyle only in the success state', () => {
    const successStyle = { borderColor: '#00FF00' };
    const { getByLabelText } = render(
      <OTPCell
        char="1"
        state="success"
        theme={theme}
        cellSuccessStyle={successStyle}
        accessibilityLabel="cell"
      />
    );
    expect(flatStyle(getByLabelText('cell')).borderColor).toBe('#00FF00');
  });

  it('shows a caret instead of the placeholder in an empty active cell', () => {
    const { queryByText } = render(
      <OTPCell
        char=""
        state="focused"
        placeholder="-"
        caret
        caretAnimate={false}
        theme={theme}
        accessibilityLabel="cell"
      />
    );
    // The placeholder is replaced by the caret when the cell is active.
    expect(queryByText('-')).toBeNull();
  });

  it('keeps the digit visible alongside the caret in a filled active cell', () => {
    const { getByText } = render(
      <OTPCell
        char="7"
        state="focused"
        caret
        caretAnimate={false}
        theme={theme}
        accessibilityLabel="cell"
      />
    );
    expect(getByText('7')).toBeTruthy();
  });

  it('applies a custom fontFamily and omits fontWeight when unset', () => {
    const customFont = createTheme(getDefaultTheme('light'), {
      fontFamily: 'Inter-SemiBold',
      fontWeight: undefined,
    });
    const { getByText } = render(
      <OTPCell
        char="5"
        state="filled"
        theme={customFont}
        accessibilityLabel="cell"
      />
    );
    const style = flatStyle(getByText('5'));
    expect(style.fontFamily).toBe('Inter-SemiBold');
    expect(style.fontWeight).toBeUndefined();
  });

  it('renders the underline variant with only a bottom border', () => {
    const minimal = getMinimalTheme('light');
    const { getByLabelText } = render(
      <OTPCell
        char="1"
        state="filled"
        theme={minimal}
        accessibilityLabel="cell"
      />
    );
    const style = flatStyle(getByLabelText('cell'));
    expect(style.borderBottomWidth).toBe(minimal.cellBorderWidth);
    expect(style.borderWidth).toBeUndefined();
    expect(style.backgroundColor).toBe('transparent');
  });
});
