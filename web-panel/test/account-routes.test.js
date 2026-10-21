import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchAdminPage, matchAccountDetails, accountDetailsParent } from '../src/routes.js';

test('account details support direct links in development and production', () => {
  assert.equal(matchAdminPage('/accounts/influencer/inf_1', '/'), 'account-details');
  assert.deepEqual(matchAccountDetails('/admin/accounts/user/user%20one', '/admin/'), { role: 'user', id: 'user one' });
  assert.equal(matchAdminPage('/admin/accounts/admin/adm_1', '/admin/'), 'account-details');
  assert.equal(matchAdminPage('/admin/approvals', '/admin/'), 'approvals');
});
test('invalid account routes and external return destinations are rejected', () => {
  for (const path of ['/accounts/owner/one', '/accounts/user/', '/accounts/user/%bad', '/elsewhere/accounts/user/id'])
    assert.equal(matchAccountDetails(path, '/'), null);
  assert.equal(accountDetailsParent('?from=bookings'), 'bookings');
  assert.equal(accountDetailsParent('?from=https://example.com'), 'approvals');
  assert.equal(accountDetailsParent(''), 'approvals');
});

test('edit and add forms have separate routes with safe return destinations', () => {
  assert.equal(matchAdminPage('/profile/edit', '/'), 'edit-profile');
  assert.equal(matchAdminPage('/admin/profile/edit', '/admin/'), 'edit-profile');
  assert.equal(matchAdminPage('/announcements/new', '/'), 'add-announcement');
  assert.equal(matchAdminPage('/admin/announcements/new', '/admin/'), 'add-announcement');
  assert.equal(accountDetailsParent('?from=announcements'), 'announcements');
});
