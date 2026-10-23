import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { db } from '../src/db.js';
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../src/passwordRecovery.js';
const response = () => {
  return {
    code: 200,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
};

test('OTP recovery: all roles, expiry, one-time use, guess limits, and explicit production test mode', async () => {
  const original = { read: db.read, write: db.write, fetch: globalThis.fetch };
  const names = [
    'NODE_ENV',
    'RESEND_API_KEY',
    'PASSWORD_RESET_FROM',
    'PASSWORD_RESET_TEST_OTP',
  ];
  const env = Object.fromEntries(
    names.map((name) => {
      return [name, process.env[name]];
    }),
  );
  process.env.NODE_ENV = 'production';
  process.env.RESEND_API_KEY = 'mail-key';
  process.env.PASSWORD_RESET_FROM = 'mail@example.com';
  delete process.env.PASSWORD_RESET_TEST_OTP;
  let data = { users: [], influencers: [], admins: [], passwordresets: [] };
  const deliveries = [];
  db.read = () => {
    return structuredClone(data);
  };
  db.write = (value) => {
    data = value;
    return true;
  };
  globalThis.fetch = async (_, options) => {
    deliveries.push(JSON.parse(options.body));
    return { ok: true };
  };
  try {
    for (const [role, collection] of [
      ['user', 'users'],
      ['influencer', 'influencers'],
      ['admin', 'admins'],
    ]) {
      const email = `${role}@example.com`;
      data[collection].push({
        id: role,
        role,
        email,
        password: await bcrypt.hash('oldpassword', 4),
        status: 'approved',
      });
      const requestCode = async () => {
        const result = response();
        await forgotPassword({ body: { role, email } }, result);
        return result;
      };
      const verify = async (otp) => {
        const result = response();
        await verifyOtp({ body: { role, email, otp } }, result);
        return result;
      };
      const save = async (
        resetToken,
        password = 'newpassword',
        resetRole = role,
      ) => {
        const result = response();
        await resetPassword(
          { body: { role: resetRole, email, resetToken, password } },
          result,
        );
        return result;
      };
      const sent = await requestCode();
      assert.equal(sent.code, 200);
      assert.equal(sent.body.developmentOtp, undefined);
      const otp = deliveries.at(-1).text.match(/\n\n(\d{6})\n\n/)[1];
      assert.notEqual(data.passwordresets.at(-1).otpHash, otp);
      const unknown = response();
      await forgotPassword(
        { body: { role, email: 'unknown@example.com' } },
        unknown,
      );
      assert.deepEqual(unknown.body, sent.body);
      const count = deliveries.length;
      await requestCode();
      assert.equal(deliveries.length, count);
      assert.equal(
        (await save(undefined)).code,
        400,
        'password reset requires a verified session',
      );
      const verified = await verify(otp);
      assert.equal(verified.code, 200);
      assert.equal(
        await bcrypt.compare('oldpassword', data[collection][0].password),
        true,
        'OTP verification must not change password',
      );
      const resetToken = verified.body.resetToken;
      assert.equal(resetToken.length, 64);
      assert.notEqual(data.passwordresets.at(-1).resetTokenHash, resetToken);
      assert.equal((await save(resetToken, 'short')).code, 400);
      assert.equal((await save('0'.repeat(64))).code, 400);
      assert.equal(
        (
          await save(
            resetToken,
            'newpassword',
            role === 'admin' ? 'user' : 'admin',
          )
        ).code,
        400,
      );
      const expiry = data.passwordresets.at(-1).resetExpiresAt;
      data.passwordresets.at(-1).resetExpiresAt = new Date(
        Date.now() - 1,
      ).toISOString();
      assert.equal((await save(resetToken)).code, 400);
      data.passwordresets.at(-1).resetExpiresAt = expiry;
      assert.equal((await save(resetToken)).code, 200);
      assert.equal(
        await bcrypt.compare('newpassword', data[collection][0].password),
        true,
      );
      assert.equal(data[collection][0].sessionVersion, 1);
      assert.equal((await verify(otp)).code, 400);
      assert.equal((await save(resetToken)).code, 400);
      data.passwordresets.at(-1).createdAt = new Date(
        Date.now() - 120000,
      ).toISOString();
      await requestCode();
      const fresh = deliveries.at(-1).text.match(/\n\n(\d{6})\n\n/)[1];
      for (let n = 0; n < 5; n++) {
        assert.equal(
          (await verify(fresh === '000000' ? '999999' : '000000')).code,
          400,
        );
      }
      assert.equal(data.passwordresets.at(-1).attempts, 5);
      assert.equal((await verify(fresh)).code, 400);
      data.passwordresets.at(-1).attempts = 0;
      data.passwordresets.at(-1).expiresAt = new Date(
        Date.now() - 1000,
      ).toISOString();
      assert.equal((await verify(fresh)).code, 400);
    }
    process.env.PASSWORD_RESET_TEST_OTP = '1111';
    data.passwordresets[0].createdAt = new Date(
      Date.now() - 120000,
    ).toISOString();
    const testing = response();
    await forgotPassword(
      { body: { role: 'user', email: 'user@example.com' } },
      testing,
    );
    assert.equal(testing.body.developmentOtp, '1111');
    const verification = response();
    await verifyOtp(
      { body: { role: 'user', email: 'user@example.com', otp: '1111' } },
      verification,
    );
    assert.equal(verification.code, 200);
    const reset = response();
    await resetPassword(
      {
        body: {
          role: 'user',
          email: 'user@example.com',
          resetToken: verification.body.resetToken,
          password: 'testpassword',
        },
      },
      reset,
    );
    assert.equal(reset.code, 200);
    delete process.env.PASSWORD_RESET_TEST_OTP;
    const production = response();
    await verifyOtp(
      { body: { role: 'user', email: 'user@example.com', otp: '1111' } },
      production,
    );
    assert.equal(production.code, 400);
  } finally {
    db.read = original.read;
    db.write = original.write;
    globalThis.fetch = original.fetch;
    for (const [name, value] of Object.entries(env)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});
