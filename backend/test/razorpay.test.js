import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifySignature } from '../src/razorpay.js';
test('Razorpay proof binds the payment to its server order', () => {
  const signature = createHmac('sha256', 'secret').update('order_123|pay_456').digest('hex');
  assert.equal(
    verifySignature('order_123', 'pay_456', signature, 'secret'),
    true,
  );
  assert.equal(
    verifySignature('order_other', 'pay_456', signature, 'secret'),
    false,
  );
  assert.equal(
    verifySignature('order_123', 'pay_other', signature, 'secret'),
    false,
  );
  for (const value of [undefined, '', 'xyz', '00', 'g'.repeat(64)]) {
    assert.equal(
      verifySignature('order_123', 'pay_456', value, 'secret'),
      false,
    );
  }
});

test('missing backend keys and Razorpay rejection return actionable errors without credentials', async () => {
  const { paymentConfig, razorpayRequest, PaymentError } =
    await import('../src/razorpay.js');
  const original = {
    key: process.env.RAZORPAY_KEY_ID,
    secret: process.env.RAZORPAY_KEY_SECRET,
    fetch: globalThis.fetch,
  };
  try {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    assert.throws(paymentConfig, (error) => {
      return (
        error instanceof PaymentError &&
        error.status === 503 &&
        error.code === 'PAYMENT_NOT_CONFIGURED'
      );
    });
    process.env.RAZORPAY_KEY_ID = 'private_test_key';
    process.env.RAZORPAY_KEY_SECRET = 'private_test_secret';
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 401,
        json: async () => {
          return { error: { description: 'private_test_secret' } };
        },
      };
    };
    await assert.rejects(
      razorpayRequest('orders', { amount: 100 }),
      (error) => {
        assert.equal(error.code, 'PAYMENT_AUTH_FAILED');
        assert.equal(error.message.includes('private_test_secret'), false);
        return true;
      },
    );
    globalThis.fetch = async () => {
      throw new Error('connection failed');
    };
    await assert.rejects(razorpayRequest('orders', { amount: 100 }), {
      code: 'PAYMENT_CONNECTION_FAILED',
    });
  } finally {
    globalThis.fetch = original.fetch;
    for (const [name, value] of [
      ['RAZORPAY_KEY_ID', original.key],
      ['RAZORPAY_KEY_SECRET', original.secret],
    ]) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  }
});
