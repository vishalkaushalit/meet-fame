import { test } from 'node:test';
import assert from 'node:assert/strict';
import adminRoutes from '../src/routes/admin.routes.js';
import { db } from '../src/db.js';
const update = adminRoutes.stack.find(
  (layer) => layer.route?.path === '/profile',
).route.stack[0].handle;
const response = () => ({
  code: 200,
  status(code) {
    this.code = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});
test('admin profile updates only the signed-in account and rejects invalid or duplicate emails', () => {
  const read = db.read,
    write = db.write;
  const data = {
    admins: [
      {
        id: 'a1',
        name: 'Admin',
        email: 'first@example.com',
        password: 'private',
        role: 'admin',
      },
      {
        id: 'a2',
        name: 'Other',
        email: 'other@example.com',
        password: 'private',
        role: 'admin',
      },
    ],
  };
  db.read = () => data;
  db.write = () => true;
  const submit = (body) => {
    const res = response();
    update({ adminId: 'a1', body }, res);
    return res;
  };
  try {
    const saved = submit({
      id: 'a2',
      role: 'user',
      password: 'changed',
      name: ' Updated ',
      email: ' UPDATED@example.com ',
      phone: ' +91 98765 43210 ',
    });
    assert.equal(saved.code, 200);
    assert.equal(saved.body.user.email, 'updated@example.com');
    assert.equal(saved.body.user.name, 'Updated');
    assert.equal(saved.body.user.phone, '+919876543210');
    assert.equal(saved.body.user.id, 'a1');
    assert.equal(saved.body.user.role, 'admin');
    assert.equal(saved.body.user.password, undefined);
    assert.equal(data.admins[0].password, 'private');
    assert.equal(data.admins[1].name, 'Other');
    assert.equal(
      submit({ name: 'Admin', email: 'OTHER@example.com', phone: '' }).code,
      409,
    );
    assert.equal(
      submit({ name: ' ', email: 'ok@example.com', phone: '' }).code,
      400,
    );
    assert.equal(
      submit({ name: 'Admin', email: 'invalid', phone: '' }).code,
      400,
    );
    assert.equal(
      submit({ name: 'Admin', email: 'ok@example.com', phone: '1'.repeat(41) })
        .code,
      400,
    );
  } finally {
    db.read = read;
    db.write = write;
  }
});
