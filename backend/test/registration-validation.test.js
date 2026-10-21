import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  registrationErrors,
  registrationStep,
  certificateError,
  introVideoError,
} from '../../shared/registrationValidation.js';
import routes from '../src/routes/auth.routes.js';
import { db } from '../src/db.js';
const valid = {
  name: 'Test Creator',
  email: 'creator@example.com',
  phone: '+91 98765 43210',
  password: 'password123',
  specialization: 'AI strategy',
  category: 'Technology & AI',
  hourlyRate: 200,
  introVideoFile: { name: 'intro.mp4', type: 'video/mp4', size: 1024 },
};
test('signup validation accepts supported names/phones and optional certification', () => {
  assert.deepEqual(registrationErrors(valid, 'influencer'), {});
  assert.deepEqual(
    registrationErrors({ ...valid, name: '李明', phone: '' }, 'user'),
    {},
  );
});
test('invalid signup fields map to the correct step and reject malformed types', () => {
  const errors = registrationErrors(
    {
      ...valid,
      name: ' ',
      email: 'invalid',
      phone: '123',
      password: 'short',
      specialization: ' ',
      category: 'invalid',
      hourlyRate: 'abc',
    },
    'influencer',
  );
  for (const field of [
    'name',
    'email',
    'phone',
    'password',
    'specialization',
    'category',
    'hourlyRate',
  ])
    assert.ok(errors[field], field);
  assert.equal(registrationStep('email'), 0);
  assert.equal(registrationStep('hourlyRate'), 1);
  assert.equal(registrationStep('certificateFile'), 2);
  assert.ok(
    registrationErrors({ ...valid, password: '😀'.repeat(19) }, 'user')
      .password,
  );
  assert.ok(registrationErrors({ ...valid, email: {} }, 'user').email);
});
test('certificate validation enforces format and 10 MB limit', () => {
  assert.equal(
    certificateError({
      name: 'proof.pdf',
      type: 'application/pdf',
      size: 10 * 1024 * 1024,
    }),
    '',
  );
  assert.ok(
    certificateError({
      name: 'proof.pdf',
      type: 'application/pdf',
      size: 10 * 1024 * 1024 + 1,
    }),
  );
  assert.ok(
    certificateError({ name: 'proof.exe', type: 'application/pdf', size: 20 }),
  );
  assert.ok(
    certificateError({ name: 'proof.png', type: 'text/html', size: 20 }),
  );
});
test('registration endpoints reject invalid fields before accessing account storage', async () => {
  const oldRead = db.read;
  db.read = () => assert.fail('Invalid input must not access storage');
  try {
    for (const path of ['/register-user', '/register-influencer']) {
      const handler = routes.stack
        .find((layer) => layer.route?.path === path)
        .route.stack.at(-1).handle;
      const res = {
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
      await handler(
        { body: { name: ' ', email: 'bad', password: 'short' } },
        res,
      );
      assert.equal(res.code, 400);
      assert.ok(res.body.fields.email);
    }
  } finally {
    db.read = oldRead;
  }
});

test('intro video is required and validates format and size', () => {
  assert.ok(registrationErrors({ ...valid, introVideoFile: null }, 'influencer').introVideoFile);
  assert.equal(introVideoError(valid.introVideoFile), '');
  assert.ok(introVideoError({ name: 'intro.exe', type: 'video/mp4', size: 1 }));
  assert.ok(introVideoError({ name: 'intro.mp4', type: 'text/html', size: 1 }));
  assert.ok(introVideoError({ ...valid.introVideoFile, size: 0 }));
  assert.ok(introVideoError({ ...valid.introVideoFile, size: 5 * 1024 * 1024 + 1 }));

});

test('missing intro video is rejected before accessing storage', async () => {
  const oldRead = db.read;
  db.read = () => assert.fail('Missing video must not access storage');
  try {
    const handler = routes.stack.find((layer) => layer.route?.path === '/register-influencer').route.stack.at(-1).handle;
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ body: valid }, res);
    assert.equal(res.code, 400);
    assert.ok(res.body.fields.introVideoFile);
  } finally { db.read = oldRead; }
});

test('invalid video content is rejected before accessing account storage', async () => {
  const oldRead = db.read;
  db.read = () => assert.fail('Invalid video must not access storage');
  try {
    const handler = routes.stack.find((layer) => layer.route?.path === '/register-influencer').route.stack.at(-1).handle;
    const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
    await handler({ body: valid, files: { introVideoFile: [{ originalname: 'intro.mp4', mimetype: 'video/mp4', size: 8, buffer: Buffer.from('notvideo') }] } }, res);
    assert.equal(res.code, 400);
    assert.match(res.body.fields.introVideoFile, /15 seconds/);
  } finally { db.read = oldRead; }
});
