/**
 * Localizable strings for {@link SmartOTPInput}.
 *
 * Every user-facing accessibility string the component produces is sourced from
 * a {@link SmartOTPLabels} object, so apps can translate them. Provide overrides
 * per-input via the `labels` prop or app-wide via `SmartOTPProvider`.
 *
 * @packageDocumentation
 */

export interface SmartOTPLabels {
  /** Accessibility label for the whole input, given the code length. */
  readonly input: (length: number) => string;
  /** Live progress announcement, e.g. `"2 of 6 entered"`. */
  readonly progress: (entered: number, length: number) => string;
  /** Per-cell label, e.g. `"Digit 1 of 6, empty"`. */
  readonly cell: (index: number, length: number, filled: boolean) => string;
  /** Announced to screen readers when `error` becomes `true`. */
  readonly errorAnnouncement: string;
  /** Announced to screen readers when `success` becomes `true`. */
  readonly successAnnouncement: string;
}

/** A partial set of label overrides. */
export type SmartOTPLabelsInput = Partial<SmartOTPLabels>;

/** English defaults. Every field is overridable. */
export const DEFAULT_LABELS: SmartOTPLabels = {
  input: (length) => `One-time code, ${length} digit input`,
  progress: (entered, length) => `${entered} of ${length} entered`,
  cell: (index, length, filled) =>
    `Digit ${index + 1} of ${length}, ${filled ? 'filled' : 'empty'}`,
  errorAnnouncement: 'Incorrect code',
  successAnnouncement: 'Code verified',
};

/**
 * Merge label overrides over the defaults. Later sources win; `null` /
 * `undefined` sources are ignored. Used to layer provider labels then per-input
 * `labels` on top of {@link DEFAULT_LABELS}.
 */
export function resolveLabels(
  ...sources: ReadonlyArray<SmartOTPLabelsInput | null | undefined>
): SmartOTPLabels {
  return Object.assign(
    {},
    DEFAULT_LABELS,
    ...sources.map((source) => source ?? {})
  ) as SmartOTPLabels;
}
