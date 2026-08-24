import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mediaStorageConfig,
  S3CompatibleMediaStorage,
  createMediaStorage
} from '../media-storage.js';

const env = {
  R2_ACCOUNT_ID: 'account-id',
  R2_BUCKET_NAME: 'artpark',
  R2_ACCESS_KEY_ID: 'access-key',
  R2_SECRET_ACCESS_KEY: 'secret-key',
  R2_ENDPOINT: 'https://account-id.r2.cloudflarestorage.com/',
  R2_PUBLIC_BASE_URL: 'https://media.example.test/'
};

class ListObjectsV2Command {
  constructor(input) { this.input = input; }
}

test('R2 configuration requires explicit credentials and an HTTPS endpoint', () => {
  assert.throws(() => mediaStorageConfig({}), /R2_ACCOUNT_ID.*R2_BUCKET_NAME.*R2_ACCESS_KEY_ID/);
  assert.throws(() => mediaStorageConfig({ ...env, R2_ENDPOINT: 'http://unsafe.example' }), /valid HTTPS URL/);
  const config = mediaStorageConfig(env);
  assert.deepEqual(config, {
    accountId: 'account-id',
    bucket: 'artpark',
    accessKeyId: 'access-key',
    secretAccessKey: 'secret-key',
    endpoint: 'https://account-id.r2.cloudflarestorage.com',
    publicBaseUrl: 'https://media.example.test'
  });
});

test('S3-compatible listing is bounded and returns provider-neutral metadata', async () => {
  let command;
  const storage = new S3CompatibleMediaStorage({
    bucket: 'artpark',
    publicBaseUrl: 'https://media.example.test',
    ListObjectsV2Command,
    client: { async send(value) {
      command = value;
      return { Contents: [{
        Key: 'reports/example.jpg', Size: 1234,
        LastModified: new Date('2026-08-23T12:00:00Z'), ETag: 'etag'
      }] };
    } }
  });
  const items = await storage.list({ prefix: 'reports/', maxKeys: 5000 });
  assert.deepEqual(command.input, { Bucket: 'artpark', Prefix: 'reports/', MaxKeys: 100 });
  assert.deepEqual(items, [{
    key: 'reports/example.jpg', byteSize: 1234,
    lastModified: new Date('2026-08-23T12:00:00Z'), etag: 'etag'
  }]);
  assert.equal(storage.publicUrl('reports/field image.jpg'), 'https://media.example.test/reports/field%20image.jpg');
});

test('public URLs stay disabled until a public delivery base is verified', () => {
  const storage = new S3CompatibleMediaStorage({
    bucket: 'artpark',
    ListObjectsV2Command,
    client: { async send() { return {}; } }
  });
  assert.equal(storage.publicUrl('reports/example.jpg'), null);
  assert.throws(() => storage.publicUrl('../private.txt'), /safe object key/);
});

test('factory accepts injected S3-compatible primitives without loading a vendor SDK', async () => {
  let received;
  const client = { async send(command) {
    received = command.input;
    return { Contents: [] };
  } };
  const storage = await createMediaStorage({ env, client, ListObjectsV2Command });
  assert.deepEqual(await storage.list({ maxKeys: 2 }), []);
  assert.deepEqual(received, { Bucket: 'artpark', Prefix: '', MaxKeys: 2 });
});
