import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export function phoneError(value, required = false) {
  value = typeof value === 'string' ? value.trim() : '';
  if (!value) return required ? 'Enter a phone number.' : '';
  if (!/^\+[\d\s().-]+$/.test(value))
    return 'Select a country and enter your phone number.';
  const number = parsePhoneNumberFromString(value);
  if (!number || !number.isValid())
    return 'Enter a valid phone number for the selected country.';
  return '';
}

export function normalizePhone(value) {
  return value?.trim() ? parsePhoneNumberFromString(value)?.number || value.trim() : '';
}
