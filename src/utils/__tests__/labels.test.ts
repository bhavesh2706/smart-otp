import { DEFAULT_LABELS, resolveLabels } from '../labels';

describe('resolveLabels', () => {
  it('returns the defaults when no overrides are given', () => {
    const labels = resolveLabels();
    expect(labels.progress(2, 6)).toBe('2 of 6 entered');
    expect(labels.errorAnnouncement).toBe('Incorrect code');
  });

  it('merges partial overrides over the defaults', () => {
    const labels = resolveLabels({ errorAnnouncement: 'Código incorrecto' });
    expect(labels.errorAnnouncement).toBe('Código incorrecto');
    // Untouched fields keep their defaults.
    expect(labels.successAnnouncement).toBe(DEFAULT_LABELS.successAnnouncement);
  });

  it('applies later sources over earlier ones, ignoring null/undefined', () => {
    const labels = resolveLabels(
      { errorAnnouncement: 'A' },
      null,
      { errorAnnouncement: 'B' },
      undefined
    );
    expect(labels.errorAnnouncement).toBe('B');
  });

  it('supports custom formatter functions', () => {
    const labels = resolveLabels({
      progress: (entered, length) => `${entered}/${length}`,
      cell: (index) => `pos ${index}`,
    });
    expect(labels.progress(3, 6)).toBe('3/6');
    expect(labels.cell(0, 6, true)).toBe('pos 0');
  });
});
