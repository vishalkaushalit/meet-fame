import { test } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRoutes from '../src/routes/auth.routes.js';
import adminRoutes from '../src/routes/admin.routes.js';
import { db } from '../src/db.js';

const handler = (router, path, method) =>
  router.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods[method],
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

test('admin blocking denies login and session verification; unblocking restores login', () => {
  const originalRead = db.read;
  const originalWrite = db.write;
  const data = {
    users: [
      {
        id: 'test-user',
        email: 'test@example.com',
        password: bcrypt.hashSync('test-password', 4),
        status: 'approved',
        role: 'user',
      },
    ],
    admins: [{ id: 'test-admin' }],
  };
  db.read = () => data;
  db.write = () => true;
  try {
    const login = () => {
      const res = response();
      handler(
        authRoutes,
        '/login',
        'post',
      )(
        {
          body: {
            email: 'test@example.com',
            password: 'test-password',
            role: 'user',
          },
        },
        res,
      );
      return res;
    };
    const initial = login();
    assert.equal(initial.code, 200);
    assert.ok(initial.body.token);
    const update = (status, reason = 'Repeated inappropriate messages') => {
      const res = response();
      handler(
        adminRoutes,
        '/users/:id/status',
        'put',
      )({ params: { id: 'test-user' }, body: { status, reason } }, res);
      return res;
    };
    assert.equal(update('blocked', '').code, 400);
    assert.equal(update('blocked', '   ').code, 400);
    assert.equal(update('blocked', 'a'.repeat(1001)).code, 400);
    assert.equal(data.users[0].status, 'approved');
    assert.equal(update('blocked').code, 200);
    const denied = login();
    assert.equal(denied.code, 403);
    assert.equal(denied.body.status, 'blocked');
    assert.match(denied.body.message, /Repeated inappropriate messages/);
    assert.equal(denied.body.token, undefined);
    const session = response();
    handler(
      authRoutes,
      '/me',
      'get',
    )({ headers: { authorization: `Bearer ${initial.body.token}` } }, session);
    assert.equal(session.code, 403);
    assert.equal(update('invented-status').code, 400);
    assert.equal(data.users[0].status, 'blocked');
    assert.equal(update('approved').code, 200);
    assert.equal(login().code, 200);
    assert.equal(data.users[0].statusReason, '');
    assert.equal(update('rejected').code, 400);
    assert.equal(update('pending_review').code, 400);
    data.users[0].status = 'pending_review';
    assert.equal(login().code, 200);
    assert.equal(data.users[0].status, 'approved');
    const missing = response();
    handler(
      adminRoutes,
      '/users/:id/status',
      'put',
    )(
      {
        params: { id: 'missing' },
        body: { status: 'blocked', reason: 'Test remark' },
      },
      missing,
    );
    assert.equal(missing.code, 404);

    data.influencers = [
      {
        id: 'test-influencer',
        email: 'creator@example.com',
        password: data.users[0].password,
        status: 'approved',
        role: 'influencer',
      },
    ];
    const updateInfluencer = (status, reason) => {
      const res = response();
      handler(
        adminRoutes,
        '/influencers/:id/status',
        'put',
      )({ params: { id: 'test-influencer' }, body: { status, reason } }, res);
      return res;
    };
    const creatorLogin = () => {
      const res = response();
      handler(
        authRoutes,
        '/login',
        'post',
      )(
        {
          body: {
            email: 'creator@example.com',
            password: 'test-password',
            role: 'influencer',
          },
        },
        res,
      );
      return res;
    };
    assert.equal(updateInfluencer('blocked', '  ').code, 400);
    assert.equal(
      updateInfluencer('blocked', ' Misleading credentials ').code,
      200,
    );
    const creatorDenied = creatorLogin();
    assert.equal(creatorDenied.code, 403);
    assert.equal(creatorDenied.body.reason, 'Misleading credentials');
    assert.match(creatorDenied.body.message, /Misleading credentials/);
    assert.ok(
      !creatorDenied.body.message.includes('Repeated inappropriate messages'),
    );
    assert.equal(updateInfluencer('approved').code, 200);
    assert.equal(data.influencers[0].statusReason, '');
    assert.equal(creatorLogin().code, 200);

    const guard = adminRoutes.stack.find((layer) => !layer.route).handle;
    const checkGuard = (token) => {
      const res = response();
      let passed = false;
      guard(
        { headers: token ? { authorization: `Bearer ${token}` } : {} },
        res,
        () => {
          passed = true;
        },
      );
      return { res, passed };
    };
    assert.equal(checkGuard().res.code, 401);
    assert.equal(checkGuard(initial.body.token).res.code, 403);
    const secret = process.env.JWT_SECRET || 'meetfame_secret_jwt_key_2026';
    assert.equal(
      checkGuard(jwt.sign({ id: 'test-admin', role: 'admin' }, secret)).passed,
      true,
    );
    assert.equal(
      checkGuard(jwt.sign({ id: 'deleted-admin', role: 'admin' }, secret)).res
        .code,
      403,
    );
  } finally {
    db.read = originalRead;
    db.write = originalWrite;
  }
});

test('login, session verification and admin APIs use configuration loaded after route imports', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalRead = db.read;
  process.env.JWT_SECRET = 'regression-test-secret-loaded-after-import';
  db.read = () => ({
    admins: [
      {
        id: 'config-admin',
        email: 'admin@test.example',
        password: bcrypt.hashSync('test-password', 4),
        role: 'admin',
      },
    ],
  });
  try {
    const login = response();
    handler(
      authRoutes,
      '/login',
      'post',
    )(
      {
        body: {
          email: 'admin@test.example',
          password: 'test-password',
          role: 'admin',
        },
      },
      login,
    );
    assert.equal(login.code, 200);
    assert.equal(
      jwt.verify(login.body.token, process.env.JWT_SECRET).id,
      'config-admin',
    );
    const headers = { authorization: `Bearer ${login.body.token}` };
    const session = response();
    handler(authRoutes, '/me', 'get')({ headers }, session);
    assert.equal(session.code, 200);
    assert.equal(session.body.user.id, 'config-admin');
    let passed = false;
    adminRoutes.stack
      .find((layer) => !layer.route)
      .handle({ headers }, response(), () => {
        passed = true;
      });
    assert.equal(passed, true);
  } finally {
    db.read = originalRead;
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  }
});

test('account directory includes every role without password data', () => {
  const originalRead = db.read;
  db.read = () => ({
    users: [
      {
        id: 'shared-id',
        name: 'Client',
        password: 'private',
        role: 'user',
        status: 'blocked',
        statusReason: 'Client remark',
      },
    ],
    influencers: [
      {
        id: 'shared-id',
        name: 'Creator',
        password: 'private',
        role: 'influencer',
        status: 'approved',
      },
    ],
    admins: [
      { id: 'admin-id', name: 'Admin', password: 'private', role: 'admin' },
    ],
  });
  try {
    const res = response();
    handler(adminRoutes, '/accounts', 'get')({}, res);
    assert.equal(res.code, 200);
    assert.deepEqual(
      res.body.accounts.map((account) => account.role),
      ['user', 'influencer', 'admin'],
    );
    assert.equal(res.body.accounts[0].statusReason, 'Client remark');
    assert.equal(res.body.accounts[2].status, 'active');
    assert.ok(
      res.body.accounts.every((account) => !Object.hasOwn(account, 'password')),
    );
  } finally {
    db.read = originalRead;
  }
});

test('account details selects the requested role and excludes passwords', () => {
  const originalRead = db.read;
  db.read = () => ({
    users: [
      { id: 'same-id', name: 'Client', password: 'private-user', phone: '123' },
    ],
    influencers: [
      {
        id: 'same-id',
        name: 'Creator',
        password: 'private-creator',
        specialization: 'Coaching',
        certification: { title: 'Certificate' },
      },
    ],
    admins: [
      { id: 'same-id', name: 'Administrator', password: 'private-admin' },
    ],
  });
  try {
    const details = (role, id = 'same-id') => {
      const res = response();
      handler(
        adminRoutes,
        '/accounts/:role/:id',
        'get',
      )({ params: { role, id } }, res);
      return res;
    };
    for (const [role, name] of [
      ['user', 'Client'],
      ['influencer', 'Creator'],
      ['admin', 'Administrator'],
    ]) {
      const result = details(role);
      assert.equal(result.code, 200);
      assert.equal(result.body.account.name, name);
      assert.equal(result.body.account.role, role);
      assert.equal(Object.hasOwn(result.body.account, 'password'), false);
    }
    assert.equal(
      details('influencer').body.account.certification.title,
      'Certificate',
    );
    assert.equal(details('user', 'missing').code, 404);
    assert.equal(details('invalid').code, 400);
    assert.equal(details('__proto__').code, 400);
  } finally {
    db.read = originalRead;
  }
});
