import { act, renderHook } from '@testing-library/react-native';
import { useControllableValue } from '../useControllableValue';

describe('useControllableValue', () => {
  it('seeds from defaultValue in uncontrolled mode', async () => {
    const { result } = await renderHook(() =>
      useControllableValue(undefined, '12', undefined)
    );
    expect(result.current.value).toBe('12');
    expect(result.current.isControlled).toBe(false);
  });

  it('updates internal state and calls onChange when uncontrolled', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() =>
      useControllableValue(undefined, '', onChange)
    );
    await act(() => result.current.setValue('99'));
    expect(result.current.value).toBe('99');
    expect(onChange).toHaveBeenCalledWith('99');
  });

  it('does not mutate internal state when controlled', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() =>
      useControllableValue('55', '', onChange)
    );
    expect(result.current.isControlled).toBe(true);
    await act(() => result.current.setValue('77'));
    // Value stays at the controlled prop; parent owns it.
    expect(result.current.value).toBe('55');
    expect(onChange).toHaveBeenCalledWith('77');
  });

  it('keeps setValue identity stable across renders', async () => {
    const { result, rerender } = await renderHook(
      (cb: (value: string) => void) => useControllableValue(undefined, '', cb),
      { initialProps: jest.fn() }
    );
    const first = result.current.setValue;
    await rerender(jest.fn());
    expect(result.current.setValue).toBe(first);
  });
});
