import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDecipheriv, createHash } from 'node:crypto';
import { db } from '../src/db.js';
import { getBankDetails, saveBankDetails } from '../src/bankDetails.js';

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
const valid = {
  accountHolder: 'Alex Rivera',
  bankName: 'Example Bank',
  country: 'IN',
  routingCode: 'HDFC0001234',
  accountNumber: '001234567890',
  confirmAccountNumber: '001234567890',
};

test('bank records isolate owners, encrypt sensitive values, mask responses and validate replacements', () => {
  const original = {
    read: db.read,
    write: db.write,
    secret: process.env.BANK_DETAILS_ENCRYPTION_KEY,
  };
  let data = {};
  process.env.BANK_DETAILS_ENCRYPTION_KEY =
    'test-bank-details-key-32-characters-long';
  db.read = () => {
    return structuredClone(data);
  };
  db.write = (next) => {
    data = next;
    return true;
  };
  const run = (handler, role, body = valid, id = 'owner') => {
    const res = response();
    handler({ session: { role, id }, body }, res);
    return res;
  };
  try {
    assert.equal(run(saveBankDetails, 'user').code, 403);
    assert.equal(run(getBankDetails, 'user').code, 403);
    assert.equal(
      run(saveBankDetails, 'influencer', {
        ...valid,
        confirmAccountNumber: 'wrong',
      }).code,
      400,
    );
    assert.equal(
      run(saveBankDetails, 'influencer', { ...valid, routingCode: 'invalid' }).code,
      400,
    );
    assert.equal(data.bankdetails, undefined);
    const saved = run(saveBankDetails, 'influencer', {
      ...valid,
      ownerId: 'victim',
      ownerRole: 'admin',
    });
    assert.equal(saved.code, 200);
    assert.equal(saved.body.bankDetails.maskedAccountNumber, '•••• 7890');
    assert.equal(
      JSON.stringify(saved.body).includes(valid.accountNumber),
      false,
    );
    assert.equal(JSON.stringify(data).includes(valid.accountNumber), false);
    const record = data.bankdetails[0];
    assert.equal(record.ownerId, 'owner');
    const key = createHash('sha256').update(
        `meetfame-bank-details:${process.env.BANK_DETAILS_ENCRYPTION_KEY}`,
      ).digest();
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(record.encrypted.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(record.encrypted.tag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(record.encrypted.ciphertext, 'base64')),
      decipher.final(),
    ]);
    assert.deepEqual(
      JSON.parse(plaintext),
      Object.fromEntries(
        Object.entries(valid).filter(([key]) => {
          return key !== 'confirmAccountNumber';
        }),
      ),
    );
    assert.equal(
      run(getBankDetails, 'influencer', {}, 'other').body.bankDetails,
      null,
    );
    assert.equal(run(getBankDetails, 'admin').body.bankDetails, null);
    const ownDetails = run(getBankDetails, 'influencer').body.bankDetails;
    assert.equal(ownDetails.accountNumber, valid.accountNumber);
    assert.equal(ownDetails.routingCode, valid.routingCode);
    assert.equal(run(saveBankDetails, 'admin').code, 200);
    assert.equal(data.bankdetails.length, 2);
    assert.equal(
      run(saveBankDetails, 'influencer', { ...valid, bankName: 'Updated Bank' }).code,
      200,
    );
    assert.equal(data.bankdetails.length, 2);
    assert.equal(
      run(getBankDetails, 'influencer').body.bankDetails.bankName,
      'Updated Bank',
    );
    db.write = () => {
      return false;
    };
    assert.equal(run(saveBankDetails, 'admin').code, 503);
    process.env.BANK_DETAILS_ENCRYPTION_KEY = 'short';
    assert.equal(run(saveBankDetails, 'admin').code, 503);
  } finally {
    db.read = original.read;
    db.write = original.write;
    if (original.secret === undefined) {
      delete process.env.BANK_DETAILS_ENCRYPTION_KEY;
    } else {
      process.env.BANK_DETAILS_ENCRYPTION_KEY = original.secret;
    }
  }
});
