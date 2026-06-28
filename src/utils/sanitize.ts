import type { OTPInputType } from './types';

/**
 * Per-input-type allow-lists. Compiled once at module load — never inside
 * render — so sanitizing on every keystroke stays allocation-free.
 */
const ALLOWED: Readonly<Record<OTPInputType, RegExp>> = {
  numeric: /[^0-9]/g,
  alphanumeric: /[^0-9a-zA-Z]/g,
};

/**
 * Remove every character not permitted by `type` and clamp the result to
 * `length`. Used to normalize raw keystrokes, pasted clipboard content and
 * SMS-autofilled codes through a single code path so the component never holds
 * an invalid value.
 *
 * @param raw    - Untrusted text (keyboard input, paste, autofill).
 * @param type   - Active {@link OTPInputType}.
 * @param length - Maximum number of characters to retain.
 * @returns The sanitized, length-clamped code. Never `undefined`.
 *
 * @example
 * ```ts
 * sanitizeOTP('1a2-3', 'numeric', 6); // '123'
 * sanitizeOTP('Ab12!!', 'alphanumeric', 4); // 'Ab12'
 * ```
 */
export function sanitizeOTP(
  raw: string,
  type: OTPInputType,
  length: number
): string {
  if (raw.length === 0 || length <= 0) {
    return '';
  }
  const stripped = raw.replace(ALLOWED[type], '');
  return stripped.length > length ? stripped.slice(0, length) : stripped;
}

/**
 * Split a code string into a fixed-length array of single characters, padding
 * trailing empty cells with `''`. Drives per-cell rendering without the
 * component re-deriving indices on every render.
 *
 * @param code   - Already-sanitized code (see {@link sanitizeOTP}).
 * @param length - Number of cells to produce.
 * @returns An array of exactly `length` entries, each a single char or `''`.
 */
export function toCells(code: string, length: number): readonly string[] {
  const cells = new Array<string>(Math.max(length, 0));
  for (let i = 0; i < cells.length; i += 1) {
    cells[i] = code[i] ?? '';
  }
  return cells;
}

/**
 * Per-type matchers for extracting a contiguous code of an exact length from
 * free-form text (e.g. a full SMS body such as `"Your code is 123456"`).
 * Lookarounds ensure the run is exactly `length` characters and not part of a
 * longer token. Compiled lazily and cached per `(type, length)` pair so repeated
 * clipboard/SMS scans never re-build the RegExp.
 */
const extractCache = new Map<string, RegExp>();

function getExtractRegExp(type: OTPInputType, length: number): RegExp {
  const key = `${type}:${length}`;
  const cached = extractCache.get(key);
  if (cached) {
    return cached;
  }
  const charClass = type === 'numeric' ? '0-9' : '0-9a-zA-Z';
  // (?<![class]) / (?![class]) anchor the run so we never slice a substring out
  // of a longer alphanumeric token.
  const regExp = new RegExp(
    `(?<![${charClass}])([${charClass}]{${length}})(?![${charClass}])`
  );
  extractCache.set(key, regExp);
  return regExp;
}

/**
 * Extract a one-time code of exactly `length` characters from arbitrary text.
 * Used by clipboard and SMS auto-fill paths to pull the code out of a full
 * message body without false-matching longer numbers or words.
 *
 * @param text   - Source text (clipboard contents, SMS body).
 * @param type   - Active {@link OTPInputType}.
 * @param length - Exact code length to match.
 * @returns The matched code, or `null` when no exact-length run is present.
 *
 * @example
 * ```ts
 * extractOTP('Your code is 123456. Do not share.', 'numeric', 6); // '123456'
 * extractOTP('1234567', 'numeric', 6); // null — 7 digits, not 6
 * ```
 */
export function extractOTP(
  text: string,
  type: OTPInputType,
  length: number
): string | null {
  if (text.length === 0 || length <= 0) {
    return null;
  }
  const match = getExtractRegExp(type, length).exec(text);
  return match ? (match[1] ?? null) : null;
}
