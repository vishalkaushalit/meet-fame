import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { mongoStore, persistenceModels } from '../src/mongoStore.js';

test('Mongo commit deletes removed announcements and their notifications with version checks', async () => {
  const start = mongoose.startSession;
  const originals = {};
  const state = {};
  const methods = [];
  const deleted = [];
  for (const [name, Model] of Object.entries(persistenceModels)) {
    originals[name] = new Map(); state[name] = [];
    if (['announcements', 'notifications'].includes(name)) {
      originals[name].set('removed', { _id: `${name}-id`, version: 2, value: { id: 'removed' } });
      methods.push([Model, Model.deleteOne]);
      Model.deleteOne = async (filter) => { deleted.push([name, filter]); return { deletedCount: 1 }; };
    }
  }
  mongoose.startSession = async () => ({ withTransaction: async (run) => run(), endSession: async () => {} });
  try {
    await mongoStore.commit({ originals }, state);
    assert.equal(deleted.length, 2);
    assert.deepEqual(deleted.map(([name, filter]) => [name, filter._version]), [['announcements', 2], ['notifications', 2]]);
  } finally {
    mongoose.startSession = start;
    for (const [Model, method] of methods) Model.deleteOne = method;
  }
});
