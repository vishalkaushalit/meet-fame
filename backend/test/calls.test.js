import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../src/db.js';
import calls from '../src/routes/call.routes.js';
const handler = (path) => {
  return calls.stack.find((layer) => {
    return layer.route?.path === path;
  }).route.stack[0].handle;
};
const response = () => {
  return {
    code: 200,
    status(code) {
      this.code = code;
      return this;
    },
    set() {
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
};
test('video signaling isolates booked participants, sessions and negotiation messages', async () => {
  const oldNow = Date.now;
  Date.now = () => {
    return Date.parse('2026-10-22T10:30:00+05:30');
  };
  const oldRead = db.read,
    oldMongo = process.env.MONGODB_URI,
    oldVercel = process.env.VERCEL;
  delete process.env.MONGODB_URI;
  delete process.env.VERCEL;
  const booking = {
    id: `test-${Date.now()}`,
    userId: 'user1',
    influencerId: 'creator1',
    status: 'confirmed',
    meetingType: 'video',
    date: '2026-10-22',
    slot: '10:00 - 11:00',
  };
  db.read = () => {
    return { bookings: [booking] };
  };
  const req = (role, id, body = {}) => {
    return {
      params: { bookingId: booking.id },
      session: { role, id },
      body,
    };
  };
  const invoke = async (path, request) => {
    const res = response();
    await handler(path)(request, res);
    return res;
  };
  try {
    const guard = calls.stack.find((layer) => {
      return !layer.route && layer.handle.name !== 'requireSession';
    }).handle;
    let passed = false;
    guard(req('user', 'stranger'), response(), () => {
      passed = true;
    });
    assert.equal(passed, false);
    guard(req('admin', 'admin'), response(), () => {
      return assert.fail('Admin cannot enter calls');
    });
    guard(req('user', 'user1'), response(), () => {
      passed = true;
    });
    assert.equal(passed, true);
    booking.status = 'cancelled';
    const cancelled = response();
    guard(req('user', 'user1'), cancelled, () => {
      return assert.fail();
    });
    assert.equal(cancelled.code, 409);
    booking.status = 'confirmed';
    for (const role of ['user', 'influencer']) {
      const id = role === 'user' ? 'user1' : 'creator1';
      Date.now = () => {
        return Date.parse('2026-10-22T09:59:59+05:30');
      };
      const early = response();
      guard(req(role, id), early, () => {
        return assert.fail('Early join');
      });
      assert.equal(early.code, 403);
      Date.now = () => {
        return Date.parse('2026-10-22T10:00:00+05:30');
      };
      let atStart = false;
      guard(req(role, id), response(), () => {
        atStart = true;
      });
      assert.equal(atStart, true);
      Date.now = () => {
        return Date.parse('2026-10-22T11:00:00+05:30');
      };
      const late = response();
      guard(req(role, id), late, () => {
        return assert.fail('Expired slot');
      });
      assert.equal(late.code, 403);
      let canLeave = false;
      guard({ ...req(role, id), path: '/leave' }, response(), () => {
        canLeave = true;
      });
      assert.equal(canLeave, true);
    }
    Date.now = () => {
      return Date.parse('2026-10-22T10:30:00+05:30');
    };
    const user = await invoke('/:bookingId/join', req('user', 'user1'));
    const creator = await invoke(
      '/:bookingId/join',
      req('influencer', 'creator1'),
    );
    assert.equal(user.code, 200);
    assert.ok(user.body.sessionId);
    assert.ok(user.body.iceServers.length);
    assert.equal(
      (await invoke('/:bookingId/join', req('user', 'user1'))).code,
      409,
    );
    const userSession = user.body.sessionId,
      creatorSession = creator.body.sessionId;
    const waiting = await invoke(
      '/:bookingId/poll',
      req('user', 'user1', { sessionId: userSession }),
    );
    assert.equal(waiting.body.peerId, creatorSession);
    const offer = await invoke(
      '/:bookingId/signal',
      req('user', 'user1', {
        sessionId: userSession,
        to: creatorSession,
        type: 'offer',
        payload: { type: 'offer', sdp: 'test' },
      }),
    );
    assert.equal(offer.code, 200);
    const incoming = await invoke(
      '/:bookingId/poll',
      req('influencer', 'creator1', { sessionId: creatorSession }),
    );
    assert.equal(incoming.body.signals.length, 1);
    assert.equal(incoming.body.signals[0].type, 'offer');
    assert.equal(
      (
        await invoke(
          '/:bookingId/poll',
          req('user', 'user1', { sessionId: userSession }),
        )
      ).body.signals.length,
      0,
    );
    assert.equal(
      (
        await invoke(
          '/:bookingId/poll',
          req('user', 'user1', { sessionId: creatorSession }),
        )
      ).code,
      409,
    );
    assert.equal(
      (
        await invoke(
          '/:bookingId/signal',
          req('influencer', 'creator1', {
            sessionId: creatorSession,
            to: userSession,
            type: 'offer',
            payload: { sdp: 'wrong-role' },
          }),
        )
      ).code,
      400,
    );
    assert.equal(
      (
        await invoke(
          '/:bookingId/signal',
          req('user', 'user1', {
            sessionId: userSession,
            to: 'other-room',
            type: 'candidate',
            payload: { candidate: 'test' },
          }),
        )
      ).code,
      409,
    );
    await invoke(
      '/:bookingId/leave',
      req('influencer', 'creator1', { sessionId: creatorSession }),
    );
    assert.equal(
      (
        await invoke(
          '/:bookingId/poll',
          req('user', 'user1', { sessionId: userSession }),
        )
      ).body.peerId,
      null,
    );
    assert.equal(
      (
        await invoke(
          '/:bookingId/poll',
          req('influencer', 'creator1', { sessionId: creatorSession }),
        )
      ).code,
      409,
    );
  } finally {
    Date.now = oldNow;
    db.read = oldRead;
    if (oldMongo !== undefined) {
      process.env.MONGODB_URI = oldMongo;
    }
    if (oldVercel !== undefined) {
      process.env.VERCEL = oldVercel;
    }
  }
});
