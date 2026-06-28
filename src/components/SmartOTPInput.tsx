import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import type {
  GestureResponderEvent,
  KeyboardTypeOptions,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { OTPCell } from './OTPCell';
import { useControllableValue } from '../hooks/useControllableValue';
import { useMounted } from '../hooks/useMounted';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useOtpFeedback } from '../animations/useOtpFeedback';
import { getDefaultTheme } from '../themes/defaultTheme';
import type { SmartOTPTheme } from '../themes/defaultTheme';
import { useSmartOTPLabels, useSmartOTPTheme } from '../themes/ThemeContext';
import { resolveLabels } from '../utils/labels';
import type { SmartOTPLabelsInput } from '../utils/labels';
import { sanitizeOTP, toCells } from '../utils/sanitize';
import {
  filledCount,
  HOLE,
  isComplete,
  reconcileEdit,
  stripHoles,
} from '../utils/reconcile';
import type {
  OTPAutoCompleteType,
  OTPCellState,
  OTPInputType,
  SmartOTPInputRef,
} from '../utils/types';

/**
 * Information passed to a custom {@link SmartOTPInputProps.renderCell} renderer.
 */
export interface OTPCellRenderInfo {
  /** Zero-based cell index. */
  readonly index: number;
  /** The character in this cell, or `''` when empty. */
  readonly char: string;
  /** Resolved visual state for this cell. */
  readonly state: OTPCellState;
  /** Whether the input is focused and this is the active cell. */
  readonly isFocused: boolean;
  /** Whether this cell holds a character. */
  readonly hasValue: boolean;
}

/**
 * Props for {@link SmartOTPInput}.
 *
 * The component supports both controlled (`value` + `onChange`) and
 * uncontrolled (`defaultValue`) modes. All styling props are additive overrides
 * on top of the active theme.
 */
export interface SmartOTPInputProps {
  /** Number of cells / expected code length. Must be a positive integer. */
  readonly length: number;
  /** Controlled code value. Provide together with `onChange`. */
  readonly value?: string;
  /** Initial value for uncontrolled mode. Ignored when `value` is set. */
  readonly defaultValue?: string;
  /** Called with the sanitized code on every change. */
  readonly onChange?: (code: string) => void;
  /** Called once with the full code when the final cell is filled. */
  readonly onComplete?: (code: string) => void;
  /** Focus the input on mount. Defaults to `false`. */
  readonly autoFocus?: boolean;
  /** Visually mask entered characters (secure entry). Defaults to `false`. */
  readonly mask?: boolean;
  /** Glyph used when `mask` is enabled. Defaults to `'●'`. */
  readonly maskSymbol?: string;
  /** Accepted character set. Defaults to `'numeric'`. */
  readonly type?: OTPInputType;
  /** Disable input and dim the cells. Defaults to `false`. */
  readonly disabled?: boolean;
  /**
   * Positional cell editing. When `true` (default):
   * - Tapping a cell edits that specific digit (the next keystroke overwrites it).
   * - Clearing a **middle** cell empties only that cell; the trailing digits keep
   *   their slots instead of shifting left. An emptied middle cell is represented
   *   in `value` by a space (a "hole"), so an interim `value` may look like
   *   `"12 456"`. The code is only `onComplete` when every cell is filled; use
   *   {@link stripHoles} (or `value.replace(/ /g, '')`) for the compact code.
   *
   * When `false`, the value is a plain contiguous string: tapping puts the caret
   * at the end and deleting a middle digit shifts the rest left.
   */
  readonly editableCells?: boolean;
  /** Render cells in the error state (e.g. after a failed verification). */
  readonly error?: boolean;
  /** Render cells in the success state (e.g. after a verified code). */
  readonly success?: boolean;
  /**
   * Verify the code asynchronously when the final cell fills. The component
   * manages the flow automatically: it shows the loading state while the promise
   * is pending, then the success state on `true` or the error state on `false` /
   * rejection. Editing the code afterward resets to idle.
   *
   * Controlled `loading` / `error` / `success` props still work and are merged
   * with the internal verify state.
   */
  readonly onVerify?: (code: string) => Promise<boolean>;
  /** Called if {@link SmartOTPInputProps.onVerify} rejects. */
  readonly onError?: (error: unknown) => void;
  /** Force the loading state (dims cells, shows a spinner, blocks typing). */
  readonly loading?: boolean;
  /**
   * Render a custom loading indicator centered over the cells. Defaults to a
   * themed `ActivityIndicator`.
   */
  readonly renderLoading?: () => React.ReactElement;
  /**
   * Enable the error-shake and success-pop micro-animations. Defaults to `true`.
   * Automatically suppressed when the OS "Reduce Motion" setting is on.
   */
  readonly animated?: boolean;
  /** Placeholder glyph for empty cells, e.g. `'-'`. */
  readonly placeholder?: string;
  /** Color of the placeholder glyph. Falls back to the theme. */
  readonly placeholderTextColor?: string;
  /**
   * One-time-code autofill strategy. `'sms-otp'` (default) enables iOS
   * `oneTimeCode` and Android `sms-otp` autofill; `'off'` disables it.
   */
  readonly autoCompleteType?: OTPAutoCompleteType;
  /** Override the derived keyboard type. */
  readonly keyboardType?: KeyboardTypeOptions;
  /** Allow digit text to scale with OS Dynamic Type. Defaults to `true`. */
  readonly allowFontScaling?: boolean;
  /** Explicit theme override. Defaults to the built-in light/dark theme. */
  readonly theme?: SmartOTPTheme;
  /** Style for the root row container. */
  readonly containerStyle?: StyleProp<ViewStyle>;
  /** Base style applied to every cell. */
  readonly cellStyle?: ViewStyle;
  /** Style applied to the focused cell. */
  readonly cellFocusedStyle?: ViewStyle;
  /** Style applied to filled cells. */
  readonly cellFilledStyle?: ViewStyle;
  /** Style applied to cells while `error` is `true`. */
  readonly cellErrorStyle?: ViewStyle;
  /** Style applied to cells while `success` is `true`. */
  readonly cellSuccessStyle?: ViewStyle;
  /** Style applied to the digit text. */
  readonly textStyle?: TextStyle;
  /**
   * Render each cell yourself for full control. Receives {@link OTPCellRenderInfo}
   * and must return an element. When provided, the built-in `OTPCell` and all
   * `cell*Style` props are bypassed.
   */
  readonly renderCell?: (info: OTPCellRenderInfo) => React.ReactElement;
  /**
   * Called when the input gains focus. Useful for keyboard avoidance — e.g.
   * scrolling the input above the keyboard inside a `ScrollView`.
   */
  readonly onFocus?: () => void;
  /** Called when the input loses focus. */
  readonly onBlur?: () => void;
  /** Accessibility label for the whole input. Defaults to a generated label. */
  readonly accessibilityLabel?: string;
  /**
   * Localized string overrides (i18n) for accessibility labels and screen-reader
   * announcements. Merged over the built-in English defaults; app-wide labels
   * can be set on `SmartOTPProvider`.
   */
  readonly labels?: SmartOTPLabelsInput;
  /** Accessibility hint announced by screen readers. */
  readonly accessibilityHint?: string;
  /** Test identifier applied to the underlying input. */
  readonly testID?: string;
}

const NUMERIC_KEYBOARD: KeyboardTypeOptions = 'number-pad';
const ALPHANUMERIC_KEYBOARD: KeyboardTypeOptions = 'default';

function resolveCellState(
  index: number,
  cursorIndex: number,
  char: string,
  isFocused: boolean,
  disabled: boolean,
  error: boolean,
  success: boolean
): OTPCellState {
  // error/success are explicit verification outcomes and win over disabled, so
  // a locked-after-submit field still shows its red/green state.
  if (error) {
    return 'error';
  }
  if (success) {
    return 'success';
  }
  if (disabled) {
    return 'disabled';
  }
  if (isFocused && index === cursorIndex) {
    return 'focused';
  }
  return char.length > 0 ? 'filled' : 'empty';
}

const SmartOTPInputComponent = (
  props: SmartOTPInputProps,
  ref: React.ForwardedRef<SmartOTPInputRef>
): React.ReactElement => {
  const {
    length,
    value: controlledValue,
    defaultValue = '',
    onChange,
    onComplete,
    autoFocus = false,
    mask = false,
    maskSymbol,
    type = 'numeric',
    disabled = false,
    editableCells = true,
    error = false,
    success = false,
    onVerify,
    onError,
    loading = false,
    renderLoading,
    animated = true,
    placeholder,
    placeholderTextColor,
    autoCompleteType = 'sms-otp',
    keyboardType,
    allowFontScaling = true,
    theme: themeProp,
    containerStyle,
    cellStyle,
    cellFocusedStyle,
    cellFilledStyle,
    cellErrorStyle,
    cellSuccessStyle,
    textStyle,
    renderCell,
    onFocus,
    onBlur,
    accessibilityLabel,
    labels: labelsProp,
    accessibilityHint,
    testID,
  } = props;

  if (__DEV__ && (!Number.isInteger(length) || length <= 0)) {
    // eslint-disable-next-line no-console
    console.error(
      `SmartOTPInput: "length" must be a positive integer, received ${String(
        length
      )}.`
    );
  }

  const scheme = useColorScheme();
  const contextTheme = useSmartOTPTheme();
  // Memoize so the resolved theme keeps a stable identity across renders. The
  // built-in `getDefaultTheme` returns a fresh object each call, which would
  // otherwise change the `theme` prop on every keystroke and defeat the
  // `React.memo` on each `OTPCell`.
  const theme = useMemo(
    () =>
      themeProp ??
      contextTheme ??
      getDefaultTheme(scheme === 'dark' ? 'dark' : 'light'),
    [themeProp, contextTheme, scheme]
  );

  // Merge label overrides: defaults < provider < per-input prop.
  const contextLabels = useSmartOTPLabels();
  const labels = useMemo(
    () => resolveLabels(contextLabels, labelsProp),
    [contextLabels, labelsProp]
  );
  // Latest labels in a ref so the announce effects don't depend on label
  // identity (which would otherwise risk re-announcing).
  const labelsRef = useRef(labels);
  labelsRef.current = labels;

  // Internal async-verify state machine (used only when `onVerify` is set).
  const [verifyState, setVerifyState] = useState<
    'idle' | 'verifying' | 'success' | 'error'
  >('idle');
  // Controlled props are merged with the internal state — either source can
  // drive the visual state.
  const effectiveError = error || verifyState === 'error';
  const effectiveSuccess = success || verifyState === 'success';
  const effectiveLoading = loading || verifyState === 'verifying';

  const reduceMotion = useReduceMotion();
  const { style: feedbackStyle } = useOtpFeedback({
    error: effectiveError,
    success: effectiveSuccess,
    enabled: animated && !reduceMotion,
  });

  // Announce verification outcome to screen readers on the rising edge. This
  // covers iOS (where `accessibilityLiveRegion` is not honored) and complements
  // the live region on Android.
  const prevErrorRef = useRef(effectiveError);
  const prevSuccessRef = useRef(effectiveSuccess);
  useEffect(() => {
    if (effectiveError && !prevErrorRef.current) {
      AccessibilityInfo.announceForAccessibility(
        labelsRef.current.errorAnnouncement
      );
    }
    prevErrorRef.current = effectiveError;
  }, [effectiveError]);
  useEffect(() => {
    if (effectiveSuccess && !prevSuccessRef.current) {
      AccessibilityInfo.announceForAccessibility(
        labelsRef.current.successAnnouncement
      );
    }
    prevSuccessRef.current = effectiveSuccess;
  }, [effectiveSuccess]);

  const { value, setValue } = useControllableValue(
    controlledValue,
    sanitizeOTP(defaultValue, type, length),
    onChange
  );

  const [isFocused, setIsFocused] = useState(false);
  // Controlled selection used only to position the caret when a cell is tapped;
  // it is released (set to undefined) once applied so typing stays OS-managed.
  const [selection, setSelection] = useState<
    { start: number; end: number } | undefined
  >(undefined);
  const inputRef = useRef<TextInput>(null);

  // Keep latest callbacks/value in refs so `commit` stays referentially stable.
  const valueRef = useRef(value);
  valueRef.current = value;
  // Mirror the controlled selection so `commit` knows which cell the user acted
  // on — diffing can't tell with repeated digits (e.g. deleting one `5` from
  // `"555555"`), but the selection we applied pinpoints the exact cell.
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;
  const lastCompletedRef = useRef<string | null>(null);
  // Monotonic token so a stale verify result (user edited mid-flight) is ignored.
  const verifyTokenRef = useRef(0);
  const mountedRef = useMounted();

  const commit = useCallback(
    (raw: string) => {
      let next: string;
      if (editableCells) {
        // Positional editing: clearing a middle cell leaves a hole so the
        // trailing digits keep their slots instead of sliding left. The edit is
        // located from the controlled selection (not a string diff) so repeated
        // digits never confuse which cell changed.
        const result = reconcileEdit(
          valueRef.current,
          raw,
          length,
          type,
          selectionRef.current
        );
        next = result.buffer;
        if (next === valueRef.current) {
          return;
        }
        // Park the caret (collapsed) at the END of the content after every edit.
        // This is the OS-natural cursor position, so it does NOT jam iOS the way
        // a persistent *range* selection does, and it makes the next backspace
        // remove the last character — so repeated backspace clears the boxes
        // one-by-one. A tap sets a transient range (handlePressIn) targeting a
        // specific cell for the very next keystroke; this collapse resumes after.
        setSelection({ start: next.length, end: next.length });
      } else {
        // Legacy contiguous mode: a plain sanitized string (middle deletes shift).
        next = sanitizeOTP(raw, type, length);
        if (next === valueRef.current) {
          return;
        }
        setSelection(undefined);
      }

      setValue(next);
      // Editing after a settled verify result returns to idle, and any in-flight
      // verify is invalidated via the token bump below.
      setVerifyState('idle');

      const complete = editableCells
        ? isComplete(next, length)
        : next.length === length;
      if (complete) {
        const code = stripHoles(next);
        if (lastCompletedRef.current !== code) {
          lastCompletedRef.current = code;
          onCompleteRef.current?.(code);
          const verify = onVerifyRef.current;
          if (verify) {
            const token = ++verifyTokenRef.current;
            setVerifyState('verifying');
            verify(code)
              .then((ok) => {
                if (mountedRef.current && token === verifyTokenRef.current) {
                  setVerifyState(ok ? 'success' : 'error');
                }
              })
              .catch((err: unknown) => {
                if (mountedRef.current && token === verifyTokenRef.current) {
                  setVerifyState('error');
                }
                onErrorRef.current?.(err);
              });
          }
        }
      } else {
        lastCompletedRef.current = null;
        // Invalidate any pending verify when the code becomes incomplete.
        verifyTokenRef.current += 1;
      }
    },
    [editableCells, length, type, setValue, mountedRef]
  );

  useImperativeHandle(
    ref,
    (): SmartOTPInputRef => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => commit(''),
      setValue: (code: string) => commit(code),
    }),
    [commit]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocusRef.current?.();
  }, []);
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlurRef.current?.();
  }, []);

  // Width occupied by one cell including its trailing gap, used to map a tap's
  // x-coordinate to the cell index it landed on.
  const cellPitch = theme.cellSize + theme.cellGap;

  // Explicit overlay size for the hidden input. On the New Architecture (Fabric)
  // an absolutely-filled view in a content-sized parent can resolve to a zero
  // hit frame — so taps miss it and the cells become unfocusable (while
  // `ref.focus()` and typing still work, since they don't need a frame). Sizing
  // the input to exactly cover the cell row restores tap-to-focus.
  const overlaySize = useMemo(
    () => ({
      width: length * theme.cellSize + Math.max(0, length - 1) * theme.cellGap,
      height: theme.cellSize,
    }),
    [length, theme.cellSize, theme.cellGap]
  );

  // A transparent overlay (not the input) receives the touch: iOS ignores the
  // `height` style on a single-line TextInput, leaving it a ~1px-tall hit strip
  // that taps miss — so the cells can't be focused by tapping. A plain View
  // honors its height, so the overlay covers the cells, focuses the hidden
  // input, and reads the tap's x-offset to drop the caret on the tapped cell.
  const handlePressIn = useCallback(
    (event: GestureResponderEvent) => {
      if (disabled || effectiveLoading) {
        return;
      }
      inputRef.current?.focus();
      if (!editableCells) {
        return;
      }
      const current = valueRef.current;
      const rawIndex = Math.floor(
        Math.max(event.nativeEvent.locationX, 0) / cellPitch
      );
      // Clamp to a filled cell or the first empty one — never past the input.
      const target = Math.max(
        0,
        Math.min(rawIndex, length - 1, current.length)
      );
      const end = target < current.length ? target + 1 : target;
      setSelection({ start: target, end });
    },
    [disabled, effectiveLoading, editableCells, cellPitch, length]
  );

  const cells = useMemo(() => toCells(value, length), [value, length]);

  // The active cell is where the caret sits: the tapped cell while a selection
  // is pending, otherwise the end of the content (matching the OS caret, which
  // owns positioning once the controlled selection is released). Holes are not
  // auto-targeted — the user taps a hole to refill it.
  const activeIndex =
    selection !== undefined
      ? Math.min(selection.start, length - 1)
      : Math.min(value.length, length - 1);
  // Show the caret only while focused and either still filling or mid-edit, so a
  // completed code doesn't keep a caret pinned in the last cell.
  const caretVisible =
    isFocused &&
    !disabled &&
    !effectiveLoading &&
    (selection !== undefined || !isComplete(value, length));

  // Memoized so the per-cell wrapper style keeps a stable identity across
  // renders (the only style that depends on the theme gap).
  const gapStyle = useMemo<ViewStyle>(
    () => ({ marginEnd: theme.cellGap }),
    [theme.cellGap]
  );

  const derivedKeyboard =
    keyboardType ??
    (type === 'numeric' ? NUMERIC_KEYBOARD : ALPHANUMERIC_KEYBOARD);

  const autoComplete = autoCompleteType === 'sms-otp' ? 'sms-otp' : 'off';
  const textContentType =
    autoCompleteType === 'sms-otp' && Platform.OS === 'ios'
      ? 'oneTimeCode'
      : 'none';

  const groupLabel = accessibilityLabel ?? labels.input(length);
  const enteredCount = filledCount(value);
  // Surface verification outcome to screen readers. Paired with a polite live
  // region, Android announces the change; iOS reads it on next focus.
  const stateSuffix = effectiveError
    ? `, ${labels.errorAnnouncement}`
    : effectiveSuccess
      ? `, ${labels.successAnnouncement}`
      : '';

  return (
    // The error-shake / success-pop animation lives on the ROOT, not the cell
    // row. A transformed view creates a stacking context under the New
    // Architecture (Fabric) and would paint the row above the hidden TextInput,
    // swallowing taps so the cells become uneditable. Animating the whole
    // (otherwise-static) container keeps the input reliably on top.
    <Animated.View
      style={[styles.root, containerStyle, feedbackStyle]}
      // The visible cells are decorative; the real input below carries the
      // accessible label and live value so VoiceOver/TalkBack focus the field
      // the user actually types into rather than each non-interactive cell.
      accessible={false}
    >
      <View
        style={[styles.row, effectiveLoading && styles.rowLoading]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {cells.map((raw, index) => {
          // A hole (emptied middle cell) renders as empty, not as a space glyph.
          const char = raw === HOLE ? '' : raw;
          const hasValue = char.length > 0;
          const cellIsActive = isFocused && index === activeIndex;
          const showCaret = caretVisible && index === activeIndex;
          const state = resolveCellState(
            index,
            activeIndex,
            char,
            isFocused,
            disabled,
            effectiveError,
            effectiveSuccess
          );
          return (
            <View key={index} style={index < length - 1 ? gapStyle : undefined}>
              {renderCell ? (
                renderCell({
                  index,
                  char,
                  state,
                  isFocused: cellIsActive,
                  hasValue,
                })
              ) : (
                <OTPCell
                  char={char}
                  state={state}
                  placeholder={placeholder}
                  placeholderTextColor={placeholderTextColor}
                  mask={mask}
                  maskSymbol={maskSymbol}
                  theme={theme}
                  cellStyle={cellStyle}
                  cellFocusedStyle={cellFocusedStyle}
                  cellFilledStyle={cellFilledStyle}
                  cellErrorStyle={cellErrorStyle}
                  cellSuccessStyle={cellSuccessStyle}
                  textStyle={textStyle}
                  allowFontScaling={allowFontScaling}
                  caret={showCaret}
                  caretAnimate={!reduceMotion}
                  accessibilityLabel={labels.cell(index, length, hasValue)}
                />
              )}
            </View>
          );
        })}
      </View>

      {effectiveLoading ? (
        <View
          style={styles.loadingOverlay}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {renderLoading ? (
            renderLoading()
          ) : (
            <ActivityIndicator color={theme.colors.borderFocused} />
          )}
        </View>
      ) : null}

      <TextInput
        ref={inputRef}
        style={[styles.hiddenInput, overlaySize]}
        value={value}
        onChangeText={commit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        selection={selection}
        editable={!disabled && !effectiveLoading}
        autoFocus={autoFocus}
        caretHidden
        keyboardType={derivedKeyboard}
        maxLength={length}
        autoComplete={autoComplete}
        textContentType={textContentType}
        autoCorrect={false}
        spellCheck={false}
        importantForAutofill="yes"
        allowFontScaling={false}
        accessible
        accessibilityLabel={groupLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, busy: effectiveLoading }}
        accessibilityLiveRegion="polite"
        accessibilityValue={{
          text: `${labels.progress(enteredCount, length)}${stateSuffix}`,
        }}
        testID={testID}
      />

      {/*
       * Touch target. Sized to cover the cells and sits on top of everything so
       * a tap anywhere on the field focuses the input and positions the caret.
       * It exists because iOS won't give the hidden TextInput a real height
       * (see `handlePressIn`). Hidden from accessibility — the TextInput is the
       * single focusable element for screen readers.
       */}
      {!disabled && !effectiveLoading ? (
        <View
          style={[styles.touchOverlay, overlaySize]}
          onStartShouldSetResponder={returnTrue}
          onResponderGrant={handlePressIn}
          // Not an a11y element (empty + transparent): VoiceOver passes through
          // to the TextInput beneath. No `accessibilityElementsHidden` here — it
          // would also hide the input from screen readers on some setups.
          accessible={false}
          testID={testID ? `${testID}-touch` : undefined}
        />
      ) : null}
    </Animated.View>
  );
};

// Stable predicate so the overlay's responder prop keeps a constant identity.
const returnTrue = (): boolean => true;

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Cells are decorative; never let them capture a tap meant for the input.
    // Set in style (not the deprecated prop) so it is honored on Fabric.
    pointerEvents: 'none',
  },
  // Dim the cells while a verification is in flight.
  rowLoading: {
    opacity: 0.5,
  },
  // Centered spinner over the cell row during loading.
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    // `pointerEvents` in style (not the deprecated prop) — Fabric-safe.
    pointerEvents: 'none',
  },
  // The input covers the cell row but stays visually invisible: it captures
  // keystrokes, paste and one-time-code autofill while the cells provide the
  // visuals.
  //
  // NOTE: opacity is 0.02, not 0. iOS/UIKit hit-testing ignores any view with
  // alpha < 0.01 (`hitTest` returns nil), so an `opacity: 0` input receives no
  // touches on iOS and the cells become untappable — while Android still
  // delivers touches to a 0-opacity view. A tiny non-zero opacity keeps the
  // input hit-testable on iOS yet imperceptible (transparent text + hidden
  // caret mean nothing actually renders, including the selection highlight).
  hiddenInput: {
    // Positioned + explicitly sized (see `overlaySize`) rather than
    // absolute-filled: a content-sized parent gives an absolute-fill child a
    // zero hit frame on Fabric, breaking tap-to-focus.
    position: 'absolute',
    top: 0,
    left: 0,
    // NOTE: no `fontSize: 1`. On iOS the single-line TextInput collapses its
    // height to the font's line height, overriding the explicit `height` from
    // `overlaySize` — a 1px-tall input is unhittable, so taps never focus it
    // (only `ref.focus()` + typing keep working, since they need no frame). The
    // text is invisible anyway (transparent color + hidden caret), so the
    // default font size is fine and lets the explicit `height` stand.
    padding: 0,
    opacity: 0.02,
    color: 'transparent',
  },
  // Transparent tap target over the cells (see the overlay JSX). A plain View
  // honors its height, unlike the iOS TextInput, so taps reliably land.
  touchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
  },
});

SmartOTPInputComponent.displayName = 'SmartOTPInput';

/**
 * `SmartOTPInput` — an accessible, autofill-ready OTP / PIN input.
 *
 * Renders a row of visual cells over a single hidden `TextInput`. The hidden
 * input is the real, accessible field: it receives keystrokes, clipboard paste
 * and platform one-time-code autofill (iOS `oneTimeCode`, Android `sms-otp`),
 * filling every cell atomically.
 *
 * Supports controlled and uncontrolled usage, numeric/alphanumeric input,
 * masking, theming, dark mode, RTL (via `marginEnd`), Dynamic Type and an
 * imperative {@link SmartOTPInputRef} (`focus`/`blur`/`clear`/`setValue`).
 *
 * @example Uncontrolled
 * ```tsx
 * <SmartOTPInput length={6} onComplete={(code) => verify(code)} autoFocus />
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [code, setCode] = useState('');
 * <SmartOTPInput length={4} value={code} onChange={setCode} />
 * ```
 */
export const SmartOTPInput = forwardRef<SmartOTPInputRef, SmartOTPInputProps>(
  SmartOTPInputComponent
);
