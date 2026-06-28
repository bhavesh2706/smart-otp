import { extractOTP, sanitizeOTP, toCells } from '../sanitize';

describe('sanitizeOTP', () => {
  it('keeps only digits in numeric mode', () => {
    expect(sanitizeOTP('1a2-3', 'numeric', 6)).toBe('123');
  });

  it('keeps digits and letters in alphanumeric mode', () => {
    expect(sanitizeOTP('Ab12!! ', 'alphanumeric', 6)).toBe('Ab12');
  });

  it('clamps to length', () => {
    expect(sanitizeOTP('123456789', 'numeric', 4)).toBe('1234');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeOTP('', 'numeric', 6)).toBe('');
  });

  it('returns empty string for non-positive length', () => {
    expect(sanitizeOTP('123', 'numeric', 0)).toBe('');
  });
});

describe('toCells', () => {
  it('produces an array of exactly length entries', () => {
    expect(toCells('12', 4)).toEqual(['1', '2', '', '']);
  });

  it('truncates extra characters defensively', () => {
    expect(toCells('123456', 4)).toEqual(['1', '2', '3', '4']);
  });

  it('handles zero length', () => {
    expect(toCells('123', 0)).toEqual([]);
  });
});

describe('extractOTP', () => {
  it('pulls a numeric code from an SMS body', () => {
    expect(extractOTP('Your code is 123456. Do not share.', 'numeric', 6)).toBe(
      '123456'
    );
  });

  it('returns null when the run is longer than length', () => {
    expect(extractOTP('1234567', 'numeric', 6)).toBeNull();
  });

  it('returns null when the run is shorter than length', () => {
    expect(extractOTP('code 12345', 'numeric', 6)).toBeNull();
  });

  it('matches alphanumeric codes', () => {
    expect(extractOTP('Login code: A1B2C3 now', 'alphanumeric', 6)).toBe(
      'A1B2C3'
    );
  });

  it('returns null for empty text', () => {
    expect(extractOTP('', 'numeric', 6)).toBeNull();
  });

  it('returns null for non-positive length', () => {
    expect(extractOTP('123456', 'numeric', 0)).toBeNull();
  });
});
