import { normalizePhone } from '../src/lib/parser';

describe('Phone Normalization', () => {
  it('should format a valid 10-digit number with default country code', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210');
  });

  it('should keep existing country code if present', () => {
    expect(normalizePhone('+12345678901')).toBe('+12345678901');
  });

  it('should strip spaces and dashes', () => {
    expect(normalizePhone('+91 987-654-3210')).toBe('+919876543210');
    expect(normalizePhone('(987) 654 3210')).toBe('+919876543210');
  });

  it('should throw error for too short or too long numbers', () => {
    expect(() => normalizePhone('12345')).toThrow('Invalid phone number length');
    expect(() => normalizePhone('+1234567890123456')).toThrow('Invalid phone number length');
  });
});
