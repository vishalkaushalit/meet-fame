import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { mongoStore, persistenceModels } from '../src/mongoStore.js';
import { AccountIdentityLock } from '../src/models/AccountIdentityLock.js';

test('Mongo commits serialize identity changes and reject cross-role duplicates in stored data', async () => {
  const start = mongoose.startSession;
  const lock = AccountIdentityLock.updateOne;
  const methods = [];
  const originals = Object.fromEntries(Object.keys(persistenceModels).map((name) => [name, new Map()]));
  const previous = { id: 'u1', email: 'before@example.com', phone: '+12025550123' };
  originals.users.set('u1', { value: previous, version: 1, _id: 'mongo-u1' });
  const state = { users: [{ ...previous, email: 'taken@example.com' }], influencers: [], admins: [] };
  const locked = [];
  let queryCount = 0;
  mongoose.startSession = async () => ({ withTransaction: async (run) => run(), endSession: async () => {} });
  AccountIdentityLock.updateOne = async (filter, update, options) => {
    assert.ok(options.session);
    assert.equal(update.$inc.revision, 1);
    assert.equal(filter._id.length, 64);
    locked.push(filter._id);
  };
  for (const name of ['users', 'influencers', 'admins']) {
    const Model = persistenceModels[name];
    methods.push([Model, Model.find]);
    Model.find = () => ({ session: () => ({ lean: async () => {
      queryCount++;
      return name === 'influencers' ? [{ id: 'i1', email: 'TAKEN@example.com' }] : name === 'users' ? [previous] : [];
    } }) });
  }
  try {
    await assert.rejects(mongoStore.commit({ originals }, state), (error) => {
      assert.equal(error.code, 'ACCOUNT_IDENTITY_CONFLICT');
      assert.match(error.fields.email, /already in use/);
      return true;
    });
    assert.equal(locked.length, 2);
    assert.equal(queryCount, 3);
  } finally {
    mongoose.startSession = start;
    AccountIdentityLock.updateOne = lock;
    for (const [Model, find] of methods) Model.find = find;
  }
});
