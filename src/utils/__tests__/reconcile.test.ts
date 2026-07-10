import {
  filledCount,
  HOLE,
  isComplete,
  reconcileEdit,
  stripHoles,
} from '../reconcile';
import type { Selection } from '../reconcile';

/** Helper: run an edit and return just the buffer. */
const edit = (prev: string, raw: string, sel: Selection, len = 6) =>
  reconcileEdit(prev, raw, len, 'numeric', sel).buffer;

/** A one-cell tap selection on cell `i`. */
const tap = (i: number): Selection => ({ start: i, end: i + 1 });
/** A collapsed caret at `c`. */
const caret = (c: number): Selection => ({ start: c, end: c });

describe('reconcileEdit — tapped-cell delete (duplicate-safe)', () => {
  it('deleting box 2 of "555555" clears box 2 only (no shift)', () => {
    // Native shifts to "55555"; the tap selection pins box 2 = index 1.
    expect(edit('555555', '55555', tap(1))).toBe(`5${HOLE}5555`);
  });

  it('deleting box 4 of "233446" clears box 4 only (adjacent dup safe)', () => {
    // Native → "23346"; tap pins box 4 = index 3, not the equal digit at 4.
    expect(edit('233446', '23346', tap(3))).toBe(`233${HOLE}46`);
  });

  it('deleting the last box leaves no trailing hole', () => {
    expect(edit('555555', '55555', tap(5))).toBe('55555');
  });

  it('overwriting a tapped duplicate cell changes only that cell', () => {
    // Tap box 3 of "555555", type 9 → native "559555" but selection pins index 2.
    expect(edit('555555', '559555', tap(2))).toBe('559555');
  });

  it('filling a tapped hole (replace) sets only that cell', () => {
    expect(edit(`5${HOLE}5555`, '555555', tap(1))).toBe('555555');
  });
});

describe('reconcileEdit — sequential backspace (caret at end)', () => {
  it('removes the last filled cell one at a time through duplicates', () => {
    expect(edit('555555', '55555', caret(6))).toBe('55555');
    expect(edit('55555', '5555', caret(5))).toBe('5555');
    expect(edit('5', '', caret(1))).toBe('');
  });

  it('clears box-by-box from the end across holes', () => {
    // "1 3  6" → remove last filled (6) → "1 3" → remove 3 → "1" → remove 1.
    expect(edit('1 3  6', '1 3  ', caret(6))).toBe('1 3');
    expect(edit('1 3', '1 ', caret(3))).toBe('1');
    expect(edit('1', '', caret(1))).toBe('');
  });

  it('backspace clears the boxed cell (caret on a filled cell), not the previous', () => {
    // Complete code, caret collapsed ON box 6 (index 5) — e.g. after editing an
    // earlier box the caret advances onto the filled last box. Backspace must
    // clear box 6 (the highlighted cell), leaving box 5 intact.
    expect(edit('111125', '11112', caret(5))).toBe('11112');
    // Sanity: the same edit with the caret past the end also clears box 6.
    expect(edit('111125', '11112', caret(6))).toBe('11112');
  });

  it('clearing the last digit puts the caret on box 1 even behind a hole', () => {
    // Buffer " 5" = box 1 hole, box 2 filled. Backspacing box 2 empties the
    // buffer; the caret must land on box 1 (index 0), not stay on box 2.
    const r = reconcileEdit(' 5', ' ', 6, 'numeric', caret(2));
    expect(r.buffer).toBe('');
    expect(r.caret).toBe(0);
    // Same for a deeper leading-hole run: "  8" (boxes 1-2 holes, box 3 filled).
    const r2 = reconcileEdit('  8', '  ', 6, 'numeric', caret(3));
    expect(r2.buffer).toBe('');
    expect(r2.caret).toBe(0);
  });
});

describe('reconcileEdit — typing & paste', () => {
  it('appends a typed digit at the end (collapsed caret)', () => {
    expect(edit('12', '123', caret(2))).toBe('123');
  });

  it('ignores invalid characters', () => {
    expect(edit('12', '12a', caret(2))).toBe('12');
  });

  it('refills a hole in place when the caret sits on it', () => {
    // Caret collapsed ON the hole (index 1); native inserts the digit there.
    expect(edit('5 8888', '57 8888', caret(1))).toBe('578888');
  });

  it('reports the caret on the edited cell (delete → that cell, type → next)', () => {
    // Delete box 2 of a tapped range → caret on the emptied box 2 (index 1).
    expect(reconcileEdit('528888', '52888', 6, 'numeric', tap(1)).caret).toBe(
      1
    );
    // Then typing there advances the caret to box 3 (index 2).
    expect(
      reconcileEdit('5 8888', '57 8888', 6, 'numeric', caret(1)).caret
    ).toBe(2);
  });

  it('fills compactly from a multi-char paste', () => {
    expect(edit('', '778899', undefined)).toBe('778899');
    expect(edit('1', '4815', undefined)).toBe('4815');
  });

  it('treats a full clear (multi-delete) as empty', () => {
    expect(edit('123456', '', undefined)).toBe('');
  });
});

describe('hole helpers', () => {
  it('filledCount ignores holes', () => {
    expect(filledCount(`12${HOLE}456`)).toBe(5);
  });

  it('isComplete is false with a hole, true when fully filled', () => {
    expect(isComplete(`12${HOLE}456`, 6)).toBe(false);
    expect(isComplete('123456', 6)).toBe(true);
    expect(isComplete('12345', 6)).toBe(false);
  });

  it('stripHoles yields the compact code', () => {
    expect(stripHoles(`12${HOLE}456`)).toBe('12456');
  });
});
