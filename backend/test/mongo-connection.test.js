import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionManager } from '../src/mongoConnection.js';
test('failed startup connection retries on the next request and shares concurrent attempts', async () => {
  let attempts = 0;
  const driver = {
    connection: { readyState: 0 },
    async connect(uri) {
      attempts++;
      await Promise.resolve();
      if (attempts === 1)
        throw Object.assign(new Error('network unavailable'), {
          name: 'MongoServerSelectionError',
        });
      driver.connection.readyState = 1;
    },
  };
  const manager = createConnectionManager(
    driver,
    () => 'mongodb://database.example/test',
  );
  await assert.rejects(manager.connect());
  assert.equal(manager.status().issue, 'network_unreachable');
  await Promise.all([manager.connect(), manager.connect(), manager.connect()]);
  assert.equal(attempts, 2);
  assert.equal(manager.status().issue, null);
});
test('configuration and authentication failures are classified without exposing credentials', async () => {
  let used;
  const driver = {
    connection: { readyState: 0 },
    async connect(uri) {
      used = uri;
      throw Object.assign(new Error('bad auth secret-password'), { code: 18 });
    },
  };
  const manager = createConnectionManager(
    driver,
    () => ' "mongodb://user:secret-password@database.example/test" ',
  );
  await assert.rejects(manager.connect());
  assert.equal(used, 'mongodb://user:secret-password@database.example/test');
  assert.equal(manager.status().issue, 'authentication_failed');
  assert.ok(!JSON.stringify(manager.status()).includes('secret-password'));
  const missing = createConnectionManager(driver, () => undefined);
  await assert.rejects(missing.connect());
  assert.equal(missing.status().issue, 'missing_configuration');
  const invalid = createConnectionManager(driver, () => 'not-a-uri');
  await assert.rejects(invalid.connect());
  assert.equal(invalid.status().issue, 'invalid_configuration');
});
