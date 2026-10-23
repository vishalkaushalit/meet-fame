import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatDateTime } from '../../shared/dateFormat.js';

test('shared dates consistently use the India timezone across pages', () => {
  assert.equal(formatDate('2026-10-23'), '23 Oct, 2026');
  assert.equal(formatDate('2026-10-22T20:00:00Z'), '23 Oct, 2026');
  assert.equal(formatDateTime('2026-10-22T20:00:00Z'), '23 Oct, 2026, 01:30:00');
  assert.equal(formatDate('2026-10-23T20:00:00Z'), '24 Oct, 2026');
  for (const value of [undefined, null, '', 'not-a-date']) {
    assert.equal(formatDate(value), '—');
    assert.equal(formatDateTime(value), '—');
  }
});
