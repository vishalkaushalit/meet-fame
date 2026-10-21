import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phoneError, normalizePhone } from '../../shared/phoneValidation.js';

test('international phone validation enforces country-specific number lengths', () => {
  for (const phone of ['+919876543210', '+14155552671', '+442079460018'])
    assert.equal(phoneError(phone, true), '', phone);
  for (const phone of ['+91987654321', '+9198765432101', '+1415555267', '+999123456789', '9876543210', '+91abc123'])
    assert.ok(phoneError(phone, true), phone);
  assert.equal(phoneError(''), '');
  assert.ok(phoneError('', true));
});
test('numbers are stored with a single country prefix and no formatting', () => {
  assert.equal(normalizePhone('+91 98765 43210'), '+919876543210');
  assert.equal(normalizePhone('+44 020 7946 0018'), '+442079460018');
  assert.equal(normalizePhone(''), '');
});
