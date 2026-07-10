import { sanitizeOTP } from './sanitize';
import type { OTPInputType } from './types';

/**
 * Sentinel used to mark a *positional hole* — a middle cell the user emptied,
 * whose trailing siblings must keep their slots instead of sliding left. A
 * regular space is used so the public value stays human-readable; it can never
 * be typed into a cell because {@link sanitizeChar} strips it.
 */
export const HOLE = ' ';

const ALLOWED: Readonly<Record<OTPInputType, RegExp>> = {
  numeric: /[0-9]/,
  alphanumeric: /[0-9a-zA-Z]/,
};

/** Return the char if permitted by `type`, else `''`. */
function sanitizeChar(char: string, type: OTPInputType): string {
  return ALLOWED[type].test(char) ? char : '';
}

/** The number of filled cells (holes do not count). */
export function filledCount(buffer: string): number {
  let count = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    if (buffer[i] !== HOLE) {
      count += 1;
    }
  }
  return count;
}

/** Whether a buffer is a complete code: exactly `length` chars and no holes. */
export function isComplete(buffer: string, length: number): boolean {
  return buffer.length === length && buffer.indexOf(HOLE) === -1;
}

/** Strip positional holes, yielding the compact code (for `onComplete`). */
export function stripHoles(buffer: string): string {
  return buffer.split(HOLE).join('');
}

/** Longest common prefix length of two strings. */
function commonPrefix(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) {
    i += 1;
  }
  return i;
}

/** Build a buffer from a cell array, trimming trailing empties/holes. */
function build(cells: readonly string[]): string {
  let last = -1;
  for (let i = 0; i < cells.length; i += 1) {
    const c = cells[i];
    if (c !== undefined && c !== '' && c !== HOLE) {
      last = i;
    }
  }
  if (last < 0) {
    return '';
  }
  let out = '';
  for (let i = 0; i <= last; i += 1) {
    const c = cells[i];
    out += c === undefined || c === '' ? HOLE : c;
  }
  return out;
}

function toArray(buffer: string, length: number): string[] {
  const cells = new Array<string>(length);
  for (let i = 0; i < length; i += 1) {
    cells[i] = buffer[i] ?? '';
  }
  return cells;
}

/** Whether a cell value counts as filled (not empty, not a hole). */
function isFilled(cell: string | undefined): boolean {
  return cell !== undefined && cell !== '' && cell !== HOLE;
}

/**
 * Clear the cell at `index` (or the nearest filled cell to its left if `index`
 * is empty/hole, mirroring how a text field skips a gap on backspace). The cell
 * becomes a {@link HOLE} when filled cells remain to its right (so they keep
 * their slots) or simply empty when it is the last filled cell.
 */
function clearCell(
  buffer: string,
  index: number,
  length: number
): ReconcileResult {
  const cells = toArray(buffer, length);
  let target = Math.min(index, length - 1);
  while (target >= 0 && !isFilled(cells[target])) {
    target -= 1;
  }
  if (target < 0) {
    return { buffer: build(cells), caret: 0 };
  }
  let hasFilledAfter = false;
  for (let j = target + 1; j < length; j += 1) {
    if (isFilled(cells[j])) {
      hasFilledAfter = true;
      break;
    }
  }
  cells[target] = hasFilledAfter ? HOLE : '';
  const next = build(cells);
  // When the last remaining digit is cleared the buffer is empty; park the
  // caret on the FIRST cell (box 1). The cleared index can be a later box when
  // the earlier cells are holes (e.g. clearing box 2 while box 1 is a hole), so
  // returning `target` would strand the caret on box 2 and it could never reach
  // box 1. While content remains, the caret stays on the cleared cell so the
  // next keystroke refills it.
  return { buffer: next, caret: next.length === 0 ? 0 : target };
}

/** Set the cell at `index` to `char` (overwrite), returning caret after it. */
function setCell(
  buffer: string,
  index: number,
  char: string,
  length: number
): ReconcileResult {
  const cells = toArray(buffer, length);
  const target = Math.min(Math.max(index, 0), length - 1);
  cells[target] = char;
  return { buffer: build(cells), caret: Math.min(target + 1, length) };
}

/** A controlled text selection, or `undefined` when the OS owns the caret. */
export type Selection =
  { readonly start: number; readonly end: number } | undefined;

/**
 * Result of {@link reconcileEdit}: the next buffer and where the caret should
 * sit (the index of the active cell).
 */
export interface ReconcileResult {
  readonly buffer: string;
  readonly caret: number;
}

/**
 * Reconcile a raw `TextInput` edit into a *positional* buffer, using the
 * **controlled selection** to locate the edit rather than diffing the strings.
 *
 * Diffing cannot identify which cell changed when digits repeat (e.g. deleting
 * one `5` from `"555555"` is ambiguous), so the edit position is derived from
 * the selection the component applied before the keystroke:
 *
 * - a one-cell range `{s, s+1}` (set when a cell is tapped) targets cell `s`;
 * - a collapsed caret `{c, c}` targets `c` for typing and `c - 1` for backspace;
 * - no selection falls back to the end of the content.
 *
 * Single inserts/replaces/deletes edit one slot in place — clearing a middle
 * cell leaves a hole so trailing digits keep their slots. Multi-character
 * changes (paste, SMS autofill, programmatic `setValue`, full clear) fall back
 * to a compact, left-aligned fill. Characters invalid for the active
 * {@link OTPInputType} are ignored.
 *
 * @param prev   - The current buffer (may contain {@link HOLE} markers).
 * @param raw    - The raw string the native input produced.
 * @param length - Cell count.
 * @param type   - Accepted character set.
 * @param sel    - The controlled selection in effect when the user edited.
 */
export function reconcileEdit(
  prev: string,
  raw: string,
  length: number,
  type: OTPInputType,
  sel: Selection
): ReconcileResult {
  if (raw === prev) {
    return { buffer: prev, caret: Math.min(prev.length, length) };
  }

  const delta = raw.length - prev.length;

  // Multi-character change: paste, autofill, programmatic set, or full clear.
  if (delta <= -2 || delta >= 2) {
    const compact = sanitizeOTP(raw, type, length);
    return { buffer: compact, caret: Math.min(compact.length, length) };
  }

  const hasRange = sel !== undefined && sel.end > sel.start;

  // Single-character deletion (backspace).
  if (delta === -1) {
    // Clear the cell the caret is *on* — the same cell the render highlights
    // (`activeIndex = min(sel.start, length - 1)`), so what you see deleted is
    // the boxed cell. `clearCell` walks left to the nearest filled cell when
    // that cell is empty or a hole, so the common "type then backspace" flow
    // (caret sits on the empty next cell) still removes the last filled cell.
    // Without this, a collapsed caret resting on a *filled* cell (e.g. after
    // editing box 5 of a full code, the caret advances onto the filled box 6)
    // would delete the previous cell (`sel.start - 1`), mismatching the caret.
    const target = hasRange
      ? sel.start
      : sel !== undefined
        ? Math.min(sel.start, length - 1)
        : prev.length - 1;
    return clearCell(prev, target, length);
  }

  // Single-character insertion (typing).
  if (delta === 1) {
    // Insertion index = the controlled caret: a collapsed caret sits *on* the
    // cell to fill (e.g. a hole left by a middle delete), a tapped range starts
    // at the cell to overwrite, and with no selection we append at the end. The
    // native input placed the typed character at that same index, so read it
    // from `raw[target]`. This lets a mid-string caret refill its own cell
    // instead of always appending.
    const target = sel !== undefined ? sel.start : prev.length;
    if (target >= length) {
      return { buffer: prev, caret: length };
    }
    const char = sanitizeChar(raw[target] ?? '', type);
    if (char === '') {
      return { buffer: prev, caret: Math.min(prev.length, length) };
    }
    return setCell(prev, target, char, length);
  }

  // Same length: replacement (overwriting a selected/tapped cell, or autocorrect).
  const p = commonPrefix(prev, raw);
  const char = sanitizeChar(raw[p] ?? '', type);
  if (char === '') {
    return { buffer: prev, caret: Math.min(prev.length, length) };
  }
  const target = hasRange ? sel.start : p;
  return setCell(prev, target, char, length);
}
