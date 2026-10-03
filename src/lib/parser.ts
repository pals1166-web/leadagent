import * as XLSX from 'xlsx';
import { parse } from 'csv-parse/sync';

export interface ParsedRow {
  [key: string]: string;
}

export function parseFile(buffer: Buffer, filename: string): ParsedRow[] {
  const isCsv = filename.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const csvString = buffer.toString('utf-8');
    const records = parse(csvString, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records as ParsedRow[];
  } else {
    // xlsx or xls
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // raw: false ensures dates and numbers are formatted to strings
    const records = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' }) as ParsedRow[];
    return records;
  }
}

/**
 * Normalizes a phone number to E.164 format.
 * - Strips all non-digit characters (except leading +).
 * - If it has no +, defaults to a specific country code (e.g., +91 for India) if length is 10.
 * - Otherwise just returns + concatenated with digits.
 */
export function normalizePhone(phone: string, defaultCountryCode = '91'): string {
  if (!phone) return '';

  let cleaned = phone.replace(/[^0-9+]/g, '');

  if (!cleaned.startsWith('+')) {
    // Assuming if it's a 10 digit number, it's local. Prepends default country code.
    if (cleaned.length === 10) {
      cleaned = '+' + defaultCountryCode + cleaned;
    } else {
      // Just prepend + as best effort
      cleaned = '+' + cleaned;
    }
  }

  // Final check: E.164 can be max 15 digits + 1 for the plus sign
  const digitCount = cleaned.replace(/[^0-9]/g, '').length;
  if (digitCount < 7 || digitCount > 15) {
    throw new Error('Invalid phone number length');
  }

  return cleaned;
}
