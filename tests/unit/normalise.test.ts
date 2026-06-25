import { describe, it, expect } from 'vitest';
import { normaliseGrade, normaliseFluorescence } from '@/lib/diamonds/normalise';

describe('normaliseGrade', () => {
  it('maps "EX" to "excellent"', () => {
    expect(normaliseGrade('EX')).toBe('excellent');
  });

  it('maps "Excellent" (mixed case) to "excellent"', () => {
    expect(normaliseGrade('Excellent')).toBe('excellent');
  });

  it('maps "excellent" (lowercase) to "excellent"', () => {
    expect(normaliseGrade('excellent')).toBe('excellent');
  });

  it('maps "VG" to "very_good"', () => {
    expect(normaliseGrade('VG')).toBe('very_good');
  });

  it('maps "Very Good" to "very_good"', () => {
    expect(normaliseGrade('Very Good')).toBe('very_good');
  });

  it('maps "G" to "good"', () => {
    expect(normaliseGrade('G')).toBe('good');
  });

  it('maps "F" to "fair"', () => {
    expect(normaliseGrade('F')).toBe('fair');
  });

  it('maps "P" to "poor"', () => {
    expect(normaliseGrade('P')).toBe('poor');
  });

  it('returns null for null input', () => {
    expect(normaliseGrade(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normaliseGrade(undefined)).toBeNull();
  });

  it('returns null for unrecognised value', () => {
    expect(normaliseGrade('unknown_grade')).toBeNull();
  });

  it('trims surrounding whitespace before mapping', () => {
    expect(normaliseGrade('  EX  ')).toBe('excellent');
  });
});

describe('normaliseFluorescence', () => {
  it('maps "None" to "none"', () => {
    expect(normaliseFluorescence('None')).toBe('none');
  });

  it('maps "None (Inert)" to "none"', () => {
    expect(normaliseFluorescence('None (Inert)')).toBe('none');
  });

  it('maps "NIL" to "none"', () => {
    expect(normaliseFluorescence('NIL')).toBe('none');
  });

  it('maps "nil" (lowercase) to "none"', () => {
    expect(normaliseFluorescence('nil')).toBe('none');
  });

  it('maps "Faint" to "faint"', () => {
    expect(normaliseFluorescence('Faint')).toBe('faint');
  });

  it('maps "Medium" to "medium"', () => {
    expect(normaliseFluorescence('Medium')).toBe('medium');
  });

  it('maps "Strong" to "strong"', () => {
    expect(normaliseFluorescence('Strong')).toBe('strong');
  });

  it('maps "Very Strong" to "very_strong"', () => {
    expect(normaliseFluorescence('Very Strong')).toBe('very_strong');
  });

  it('returns null for null input', () => {
    expect(normaliseFluorescence(null)).toBeNull();
  });

  it('returns null for unrecognised value', () => {
    expect(normaliseFluorescence('Extreme')).toBeNull();
  });
});
