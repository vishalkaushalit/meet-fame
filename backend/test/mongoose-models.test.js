import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import { persistenceModels } from '../src/mongoStore.js';
import { Notification } from '../src/models/Notification.js';

test('retained records validate against Mongoose models and preserve application IDs', async () => {
  const retained = db.read();
  for (const [name, Model] of Object.entries(persistenceModels)) {
    assert.equal(Model.collection.name, name);
    for (const record of retained[name] || []) {
      const document = new Model({ ...record, _version: 3 });
      await document.validate();
      assert.equal(document.id, record.id);
      assert.equal(document._version, 3);
    }
  }
});
test('notification model casts timestamps and rejects invalid recipient roles', async () => {
  const value = {
    id: 'notice1',
    kind: 'reminder',
    recipientId: 'u1',
    recipientRole: 'user',
    title: 'Reminder',
    message: 'Upcoming session',
    createdAt: '2026-10-19T07:15:00Z',
    readAt: null,
  };
  const document = new Notification(value);
  await document.validate();
  assert.ok(document.createdAt instanceof Date);
  assert.equal(document.toObject().id, 'notice1');
  assert.equal(
    JSON.parse(JSON.stringify(document.toObject())).createdAt,
    '2026-10-19T07:15:00.000Z',
  );
  await assert.rejects(
    new Notification({ ...value, recipientRole: 'stranger' }).validate(),
  );
});
