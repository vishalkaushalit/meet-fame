import { normalizePhone } from '../../shared/phoneValidation.js';
export const accountCollections = ['users', 'influencers', 'admins'];
export function normalizedIdentity(account) {
  return {
    email:
      typeof account.email === 'string'
        ? account.email.trim().toLowerCase()
        : '',
    phone:
      typeof account.phone === 'string' ? normalizePhone(account.phone) : '',
  };
}
export function identityErrors(data, candidate, exclude = {}) {
  const value = normalizedIdentity(candidate);
  const fields = {};
  for (const collection of accountCollections) {
    for (const item of data[collection] || []) {
      if (exclude.collection === collection && exclude.id === item.id) {
        continue;
      }
      const other = normalizedIdentity(item);
      if (value.email && value.email === other.email) {
        fields.email = 'This email address is already in use.';
      }
      if (value.phone && value.phone === other.phone) {
        fields.phone = 'This phone number is already in use.';
      }
    }
  }
  return fields;
}
