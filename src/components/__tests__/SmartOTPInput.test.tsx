import { createRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SmartOTPInput } from '../SmartOTPInput';
import type { SmartOTPInputRef } from '../../utils/types';

const INPUT = 'otp-input';

describe('SmartOTPInput', () => {
  it('fires onChange with sanitized numeric input', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput length={6} onChange={onChange} testID={INPUT} />
    );
    fireEvent.changeText(getByTestId(INPUT), '1a2');
    expect(onChange).toHaveBeenCalledWith('12');
  });

  it('fires onComplete exactly once when the final cell fills', () => {
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput length={4} onComplete={onComplete} testID={INPUT} />
    );
    const input = getByTestId(INPUT);
    fireEvent.changeText(input, '12');
    fireEvent.changeText(input, '1234');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('supports alphanumeric input', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput
        length={4}
        type="alphanumeric"
        onChange={onChange}
        testID={INPUT}
      />
    );
    fireEvent.changeText(getByTestId(INPUT), 'a1-B2');
    expect(onChange).toHaveBeenCalledWith('a1B2');
  });

  it('clamps input to length', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput length={4} onChange={onChange} testID={INPUT} />
    );
    fireEvent.changeText(getByTestId(INPUT), '123456789');
    expect(onChange).toHaveBeenCalledWith('1234');
  });

  it('honors the controlled value prop', () => {
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        value="42"
        onChange={jest.fn()}
        testID={INPUT}
      />
    );
    expect(getByTestId(INPUT).props.value).toBe('42');
  });

  it('exposes an imperative clear() and setValue() via ref', () => {
    const ref = createRef<SmartOTPInputRef>();
    const onChange = jest.fn();
    render(
      <SmartOTPInput length={6} onChange={onChange} ref={ref} testID={INPUT} />
    );
    act(() => ref.current?.setValue('789'));
    expect(onChange).toHaveBeenLastCalledWith('789');
    act(() => ref.current?.clear());
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('renders an accessible labelled input with live value', () => {
    const { getByLabelText } = render(
      <SmartOTPInput
        length={6}
        accessibilityLabel="Verification code"
        testID={INPUT}
      />
    );
    const input = getByLabelText('Verification code');
    expect(input.props.accessibilityValue).toEqual({ text: '0 of 6 entered' });
  });

  it('applies custom i18n labels to the input and announcements', () => {
    const spy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    const { getByTestId, rerender } = render(
      <SmartOTPInput
        length={6}
        value="12"
        onChange={jest.fn()}
        labels={{
          input: (len) => `Código de ${len} dígitos`,
          progress: (n, len) => `${n}/${len}`,
          errorAnnouncement: 'Código incorrecto',
        }}
        testID={INPUT}
      />
    );
    const input = getByTestId(INPUT);
    expect(input.props.accessibilityLabel).toBe('Código de 6 dígitos');
    expect(input.props.accessibilityValue).toEqual({ text: '2/6' });

    rerender(
      <SmartOTPInput
        length={6}
        value="12"
        onChange={jest.fn()}
        error
        labels={{ errorAnnouncement: 'Código incorrecto' }}
        testID={INPUT}
      />
    );
    expect(spy).toHaveBeenCalledWith('Código incorrecto');
    spy.mockRestore();
  });

  it('runs the onVerify flow: verifying → success', async () => {
    let resolve!: (ok: boolean) => void;
    const onVerify = jest.fn(
      () =>
        new Promise<boolean>((r) => {
          resolve = r;
        })
    );
    const { getByTestId } = render(
      <SmartOTPInput length={6} onVerify={onVerify} testID={INPUT} />
    );
    const input = getByTestId(INPUT);
    fireEvent.changeText(input, '123456');
    // Verifying: busy + typing blocked.
    expect(onVerify).toHaveBeenCalledWith('123456');
    expect(getByTestId(INPUT).props.accessibilityState.busy).toBe(true);
    expect(getByTestId(INPUT).props.editable).toBe(false);
    // Resolve true → success.
    await act(async () => {
      resolve(true);
    });
    await waitFor(() =>
      expect(getByTestId(INPUT).props.accessibilityState.busy).toBe(false)
    );
    expect(getByTestId(INPUT).props.accessibilityValue.text).toContain(
      'Code verified'
    );
  });

  it('runs the onVerify flow: verifying → error on false', async () => {
    const onVerify = jest.fn(() => Promise.resolve(false));
    const { getByTestId } = render(
      <SmartOTPInput length={4} onVerify={onVerify} testID={INPUT} />
    );
    await act(async () => {
      fireEvent.changeText(getByTestId(INPUT), '1234');
    });
    await waitFor(() =>
      expect(getByTestId(INPUT).props.accessibilityValue.text).toContain(
        'Incorrect code'
      )
    );
  });

  it('sets error and calls onError when onVerify rejects', async () => {
    const onError = jest.fn();
    const onVerify = jest.fn(() => Promise.reject(new Error('network')));
    const { getByTestId } = render(
      <SmartOTPInput
        length={4}
        onVerify={onVerify}
        onError={onError}
        testID={INPUT}
      />
    );
    await act(async () => {
      fireEvent.changeText(getByTestId(INPUT), '1234');
    });
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(getByTestId(INPUT).props.accessibilityValue.text).toContain(
      'Incorrect code'
    );
  });

  it('blocks typing and marks busy when loading is forced', () => {
    const { getByTestId } = render(
      <SmartOTPInput length={6} loading testID={INPUT} />
    );
    expect(getByTestId(INPUT).props.editable).toBe(false);
    expect(getByTestId(INPUT).props.accessibilityState.busy).toBe(true);
  });

  it('fires onFocus and onBlur', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        onFocus={onFocus}
        onBlur={onBlur}
        testID={INPUT}
      />
    );
    const input = getByTestId(INPUT);
    fireEvent(input, 'focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
    fireEvent(input, 'blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('applies oneTimeCode content type on iOS by default', () => {
    const { getByTestId } = render(<SmartOTPInput length={6} testID={INPUT} />);
    // Default test platform is iOS in the react-native preset.
    expect(getByTestId(INPUT).props.textContentType).toBe('oneTimeCode');
    expect(getByTestId(INPUT).props.autoComplete).toBe('sms-otp');
  });

  it('animates the root, not the cells row, and stays editable (Fabric fix)', () => {
    // A transform on the cell row creates a Fabric stacking context that paints
    // the row above the hidden input, swallowing taps. The transform must live
    // on the outermost container so the input stays on top and editable.
    const onChange = jest.fn();
    const { getByTestId, toJSON } = render(
      <SmartOTPInput length={6} error onChange={onChange} testID={INPUT} />
    );
    fireEvent.changeText(getByTestId(INPUT), '12');
    expect(onChange).toHaveBeenCalledWith('12');

    const root = toJSON() as { props: { style?: ViewStyle } };
    const rootStyle = StyleSheet.flatten(root.props.style);
    expect(rootStyle.transform).toBeDefined();
  });

  it('keeps the hidden input hit-testable on iOS (opacity > 0.01)', () => {
    // iOS/UIKit hitTest ignores views with alpha < 0.01, so an opacity-0 input
    // would receive no taps on iOS and the cells would be untappable. The input
    // must stay just above that threshold (while remaining invisible).
    const { getByTestId } = render(<SmartOTPInput length={6} testID={INPUT} />);
    const style = StyleSheet.flatten(
      getByTestId(INPUT).props.style as ViewStyle
    );
    expect(style.opacity).toBeGreaterThan(0.01);
    expect(style.opacity).toBeLessThan(0.1);
  });

  // Default theme cell pitch = cellSize(48) + cellGap(8) = 56.
  it('positions the caret over a tapped filled cell to overwrite it', () => {
    const { getByTestId } = render(
      <SmartOTPInput length={6} defaultValue="123456" testID={INPUT} />
    );
    const input = getByTestId(INPUT);
    // x within cell index 2 → [112, 168)
    fireEvent(getByTestId(`${INPUT}-touch`), 'responderGrant', {
      nativeEvent: { locationX: 120 },
    });
    expect(input.props.selection).toEqual({ start: 2, end: 3 });
  });

  it('clamps a tap beyond the entered length to the first empty cell', () => {
    const { getByTestId } = render(
      <SmartOTPInput length={6} defaultValue="12" testID={INPUT} />
    );
    const input = getByTestId(INPUT);
    // Tap cell index 5, but only 2 digits entered → caret at index 2 (no select).
    fireEvent(getByTestId(`${INPUT}-touch`), 'responderGrant', {
      nativeEvent: { locationX: 300 },
    });
    expect(input.props.selection).toEqual({ start: 2, end: 2 });
  });

  it('renders a tap overlay sized to the cells (iOS height fix)', () => {
    // iOS won't honor `height` on the hidden TextInput, so taps are caught by a
    // plain View overlay that DOES honor height. Guard its real, non-zero box.
    const { getByTestId } = render(<SmartOTPInput length={6} testID={INPUT} />);
    const overlay = getByTestId(`${INPUT}-touch`);
    const style = StyleSheet.flatten(overlay.props.style);
    // Default theme: cellSize 48, cellGap 8 → width 6*48 + 5*8 = 328.
    expect(style.height).toBe(48);
    expect(style.width).toBe(328);
  });

  it('does not reposition the caret when editableCells is false', () => {
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        defaultValue="123456"
        editableCells={false}
        testID={INPUT}
      />
    );
    const input = getByTestId(INPUT);
    fireEvent(getByTestId(`${INPUT}-touch`), 'responderGrant', {
      nativeEvent: { locationX: 120 },
    });
    expect(input.props.selection).toBeUndefined();
  });

  it('announces verification outcomes to screen readers', () => {
    const spy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => undefined);
    const { rerender } = render(<SmartOTPInput length={6} testID={INPUT} />);
    // Drop any announcements that leaked from earlier async (onVerify) tests.
    spy.mockClear();
    rerender(<SmartOTPInput length={6} error testID={INPUT} />);
    expect(spy).toHaveBeenLastCalledWith('Incorrect code');
    rerender(<SmartOTPInput length={6} success testID={INPUT} />);
    expect(spy).toHaveBeenLastCalledWith('Code verified');
    spy.mockRestore();
  });

  it('overwrites a single cell via a mid-string edit', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        defaultValue="123456"
        onChange={onChange}
        testID={INPUT}
      />
    );
    // Native replaces the selected char; we simulate the resulting string.
    fireEvent.changeText(getByTestId(INPUT), '129456');
    expect(onChange).toHaveBeenCalledWith('129456');
  });

  it('clears a middle cell positionally without shifting trailing digits', () => {
    const onChange = jest.fn();
    const onComplete = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        defaultValue="123456"
        onChange={onChange}
        onComplete={onComplete}
        testID={INPUT}
      />
    );
    const input = getByTestId(INPUT);
    // Tap box 3, then delete: native yields the shifted "12456".
    fireEvent(getByTestId(`${INPUT}-touch`), 'responderGrant', {
      nativeEvent: { locationX: 120 },
    });
    fireEvent.changeText(input, '12456');
    // Box 3 is now empty (a space marks the hole); 4,5,6 keep their slots.
    expect(onChange).toHaveBeenLastCalledWith('12 456');
    expect(input.props.value).toBe('12 456');
    // Incomplete (hole present) → not re-completed.
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('clears the tapped box with repeated digits (no shift) — "555555"', () => {
    // pitch = 56; box 2 center ≈ 84 → index 1.
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        defaultValue="555555"
        onChange={onChange}
        testID={INPUT}
      />
    );
    const input = getByTestId(INPUT);
    fireEvent(getByTestId(`${INPUT}-touch`), 'responderGrant', {
      nativeEvent: { locationX: 84 },
    });
    fireEvent.changeText(input, '55555'); // native-shifted result
    // Box 2 cleared (hole), the other 5s keep their slots.
    expect(onChange).toHaveBeenLastCalledWith('5 5555');
  });

  it('clears the tapped box with adjacent dups — "233446" box 4', () => {
    // box 4 center ≈ 196 → index 3.
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        defaultValue="233446"
        onChange={onChange}
        testID={INPUT}
      />
    );
    const input = getByTestId(INPUT);
    fireEvent(getByTestId(`${INPUT}-touch`), 'responderGrant', {
      nativeEvent: { locationX: 196 },
    });
    fireEvent.changeText(input, '23346');
    // Box 4 cleared; the equal digit in box 5 stays put (no shift).
    expect(onChange).toHaveBeenLastCalledWith('233 46');
  });

  it('collapses the caret to the end after a positional edit', () => {
    // A persistent *range* selection jams the caret on iOS; releasing it makes
    // the caret unpredictable so backspace hits the wrong box. After each edit
    // the caret is parked (collapsed) at the end of the content.
    const { getByTestId } = render(
      <SmartOTPInput length={6} defaultValue="123456" testID={INPUT} />
    );
    const input = getByTestId(INPUT);
    // Tap selects a cell (transient range) for the next keystroke.
    fireEvent(getByTestId(`${INPUT}-touch`), 'responderGrant', {
      nativeEvent: { locationX: 120 },
    });
    expect(input.props.selection).toEqual({ start: 2, end: 3 });
    // After the edit the caret collapses to the end of "12 456" (length 6).
    fireEvent.changeText(input, '12456');
    expect(input.props.selection).toEqual({ start: 6, end: 6 });
  });

  // Reproduces the reported flow: middle boxes cleared earlier leave holes,
  // then repeated keyboard backspace (caret parked at the end) must clear the
  // remaining filled boxes one-by-one until everything is empty.
  function Harness({ initial }: { initial: string }) {
    const [v, setV] = useState(initial);
    return (
      <SmartOTPInput length={6} value={v} onChange={setV} testID={INPUT} />
    );
  }

  it('clears box-by-box on backspace with holes at 2,4,5 (caret at box 6)', () => {
    // Buffer "1 3  6": boxes 1,_,3,_,_,6.
    const { getByTestId } = render(<Harness initial="1 3  6" />);
    const input = getByTestId(INPUT);
    fireEvent.changeText(input, '1 3  '); // backspace removes '6'
    expect(input.props.value).toBe('1 3');
    fireEvent.changeText(input, '1 '); // removes '3'
    expect(input.props.value).toBe('1');
    fireEvent.changeText(input, ''); // removes '1'
    expect(input.props.value).toBe('');
  });

  it('clears box-by-box on backspace with holes at 1,3,6', () => {
    // Buffer " 2 45": boxes _,2,_,4,5.
    const { getByTestId } = render(<Harness initial=" 2 45" />);
    const input = getByTestId(INPUT);
    fireEvent.changeText(input, ' 2 4'); // removes '5'
    expect(input.props.value).toBe(' 2 4');
    fireEvent.changeText(input, ' 2 '); // removes '4'
    expect(input.props.value).toBe(' 2');
    fireEvent.changeText(input, ' '); // removes '2'
    expect(input.props.value).toBe('');
  });

  it('legacy contiguous mode shifts when editableCells is false', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SmartOTPInput
        length={6}
        defaultValue="123456"
        editableCells={false}
        onChange={onChange}
        testID={INPUT}
      />
    );
    fireEvent.changeText(getByTestId(INPUT), '12456');
    expect(onChange).toHaveBeenLastCalledWith('12456');
  });
});
