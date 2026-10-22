import { createHmac, timingSafeEqual } from 'node:crypto';

export class PaymentError extends Error {
  constructor(message, status = 502, code = 'PAYMENT_PROVIDER_ERROR') {
    super(message);
    this.name = 'PaymentError';
    this.status = status;
    this.code = code;
  }
}

export function paymentConfig() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new PaymentError('Payments are not configured on the server. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the backend environment and restart the backend.', 503, 'PAYMENT_NOT_CONFIGURED');
  return { key, secret, currency: 'USD' };
}
export async function razorpayRequest(path, body) {
  const { key, secret } = paymentConfig();
  let response;
  try {
    response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  } catch {
    throw new PaymentError('Unable to connect to Razorpay. Please try again.', 503, 'PAYMENT_CONNECTION_FAILED');
  }
  let result;
  try { result = await response.json(); }
  catch { throw new PaymentError('Razorpay returned an invalid response. Please try again.'); }
  if (!response.ok) {
    if (response.status === 401)
      throw new PaymentError('Razorpay rejected the server credentials. Check the backend Razorpay key ID and secret.', 503, 'PAYMENT_AUTH_FAILED');
    if (response.status === 400)
      throw new PaymentError('Razorpay could not create or process this payment. Check the amount, currency, and enabled payment options in your Razorpay account.', 502, 'PAYMENT_REQUEST_REJECTED');
    throw new PaymentError('Razorpay is temporarily unable to process this request. Please retry or contact support.');
  }
  return result;
}
export function verifySignature(orderId, paymentId, signature, secret) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
