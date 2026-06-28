import { useCallback, useRef, useState } from 'react';

/**
 * Result of {@link useControllableValue}: the resolved value plus a setter that
 * routes through `onChange` and updates internal state only when uncontrolled.
 */
export interface ControllableValue {
  /** The value to render this frame (controlled prop or internal state). */
  readonly value: string;
  /**
   * Commit a new value. Always invokes `onChange`. In uncontrolled mode it also
   * updates internal state; in controlled mode it does not, leaving ownership
   * with the parent.
   */
  readonly setValue: (next: string) => void;
  /** `true` when a `value` prop is being supplied by the parent. */
  readonly isControlled: boolean;
}

/**
 * Standard controlled/uncontrolled value hook.
 *
 * When `controlledValue` is `undefined` the component owns its state, seeded
 * once from `defaultValue`. When `controlledValue` is a string the parent owns
 * state and the hook never writes to its internal store. Switching modes after
 * mount is a misuse and intentionally not supported (React logs the same
 * warning for native inputs).
 *
 * @param controlledValue - The `value` prop, or `undefined` when uncontrolled.
 * @param defaultValue    - Initial value used only in uncontrolled mode.
 * @param onChange        - Called with every committed value.
 */
export function useControllableValue(
  controlledValue: string | undefined,
  defaultValue: string,
  onChange?: (value: string) => void
): ControllableValue {
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue);

  // Keep the latest onChange without forcing setValue's identity to change,
  // so memoized children relying on a stable setter don't re-render.
  const onChangeRef = useRef<typeof onChange>(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternal(next);
      }
      onChangeRef.current?.(next);
    },
    [isControlled]
  );

  return {
    value: isControlled ? (controlledValue as string) : internal,
    setValue,
    isControlled,
  };
}
