import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import { updateOwnProfile } from '../src/profile.js';
import { identityErrors } from '../src/accountIdentity.js';
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('account identity checks normalize phones and email across all account types', () => {
  const data = { users: [{ id: 'u', email: 'USER@example.com', phone: '+1 (202) 555-0123' }], influencers: [{ id: 'i', email: 'creator@example.com', phone: '+919876543210' }], admins: [] };
  assert.deepEqual(Object.keys(identityErrors(data, { email: ' user@EXAMPLE.com ', phone: '+91 98765 43210' })).sort(), ['email', 'phone']);
  assert.deepEqual(identityErrors(data, data.users[0], { collection: 'users', id: 'u' }), {});
  assert.deepEqual(identityErrors(data, { email: 'new@example.com', phone: '' }), {});
});
test('profile edits are scoped to the signed-in account, validate fields and exclude privileged changes', () => {
  const original = { read: db.read, write: db.write };
  let data = {
    users: [{ id: 'u', role: 'user', name: 'User', email: 'user@example.com', phone: '+12025550123', password: 'private-hash', status: 'approved' }],
    influencers: [{ id: 'i', role: 'influencer', name: 'Creator', email: 'creator@example.com', phone: '+919876543210', password: 'private-hash', hourlyRate: 100, status: 'approved' }], admins: [],
  };
  db.read = () => structuredClone(data);
  db.write = (value) => { data = value; return true; };
  const edit = (body, role = 'user', params = {}) => {
    const result = response(); updateOwnProfile({ session: { id: role === 'user' ? 'u' : 'i', role }, body, params }, result); return result;
  };
  try {
    assert.equal(edit({ email: 'CREATOR@example.com' }).code, 409);
    assert.equal(edit({ phone: '+91 98765 43210' }).code, 409);
    assert.equal(edit({ name: '' }).code, 400);
    assert.equal(edit({ avatar: 'javascript:alert(1)' }).code, 400);
    assert.equal(edit({ name: 'Other' }, 'user', { id: 'someone-else' }).code, 403);
    const saved = edit({ name: 'New Name', email: 'new@example.com', phone: '+1 202 555 0123', role: 'admin', status: 'blocked', password: 'overwrite', isVerified: true });
    assert.equal(saved.code, 200);
    assert.equal(saved.body.user.name, 'New Name');
    assert.equal(saved.body.user.phone, '+12025550123');
    assert.equal(saved.body.user.role, 'user');
    assert.equal(saved.body.user.status, 'approved');
    assert.equal(saved.body.user.isVerified, undefined);
    assert.equal(saved.body.user.password, undefined);
    assert.equal(data.users[0].password, 'private-hash');
    assert.equal(edit({ hourlyRate: -5 }, 'influencer').code, 400);
    assert.equal(edit({ hourlyRate: 250, bio: '', specialization: 'Mentor', category: 'Technology & AI' }, 'influencer').code, 200);
    assert.equal(data.influencers[0].hourlyRate, 250);
  } finally { db.read = original.read; db.write = original.write; }
});
