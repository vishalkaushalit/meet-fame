import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  profileImageError,
  profileImageExtension,
} from '../src/profileUpload.js';
import { updateOwnProfile } from '../src/profile.js';
import { db } from '../src/db.js';

test('profile uploads enforce type, size and matching binary signatures', () => {
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(24),
  ]);
  assert.equal(
    profileImageError({ mimetype: 'image/png', size: png.length, buffer: png }),
    '',
  );
  assert.equal(profileImageExtension({ mimetype: 'image/jpeg' }), '.jpg');
  assert.match(
    profileImageError({
      mimetype: 'image/svg+xml',
      size: 100,
      buffer: Buffer.from('<svg/>'),
    }),
    /JPG, PNG, or WebP/,
  );
  assert.match(
    profileImageError({
      mimetype: 'image/png',
      size: 100,
      buffer: Buffer.from('<html>not an image</html>'),
    }),
    /not a valid/,
  );
  assert.match(
    profileImageError({
      mimetype: 'image/png',
      size: 3 * 1024 * 1024,
      buffer: png,
    }),
    /2 MB/,
  );
  assert.match(
    profileImageError({
      mimetype: 'image/png',
      size: 0,
      buffer: Buffer.alloc(0),
    }),
    /2 MB/,
  );
});
test('invalid photo never changes the account or writes profile data', async () => {
  const original = { read: db.read, write: db.write };
  db.read = () => {
    return {
      users: [
        { id: 'u', role: 'user', name: 'User', email: 'user@example.com' },
      ],
      influencers: [],
      admins: [],
    };
  };
  db.write = () => {
    return assert.fail('Invalid image must not write');
  };
  const res = {
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  try {
    await updateOwnProfile(
      {
        session: { role: 'user', id: 'u' },
        body: { name: 'Changed' },
        file: {
          mimetype: 'image/png',
          size: 20,
          buffer: Buffer.from('not an image'),
        },
      },
      res,
    );
    assert.equal(res.code, 400);
    assert.ok(res.body.fields.avatar);
  } finally {
    db.read = original.read;
    db.write = original.write;
  }
});
