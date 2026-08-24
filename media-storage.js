const REQUIRED_ENV = [
  'R2_ACCOUNT_ID',
  'R2_BUCKET_NAME',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT'
];

const withoutTrailingSlash = value => String(value || '').replace(/\/+$/, '');

export function mediaStorageConfig(env = process.env) {
  const missing = REQUIRED_ENV.filter(name => !String(env[name] || '').trim());
  if (missing.length) {
    throw new Error(`Missing media storage configuration: ${missing.join(', ')}`);
  }

  const endpoint = withoutTrailingSlash(env.R2_ENDPOINT);
  let endpointUrl;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new Error('R2_ENDPOINT must be a valid HTTPS URL');
  }
  if (endpointUrl.protocol !== 'https:') {
    throw new Error('R2_ENDPOINT must be a valid HTTPS URL');
  }

  return Object.freeze({
    accountId: String(env.R2_ACCOUNT_ID).trim(),
    bucket: String(env.R2_BUCKET_NAME).trim(),
    accessKeyId: String(env.R2_ACCESS_KEY_ID).trim(),
    secretAccessKey: String(env.R2_SECRET_ACCESS_KEY).trim(),
    endpoint,
    publicBaseUrl: withoutTrailingSlash(env.R2_PUBLIC_BASE_URL)
  });
}

function objectKey(value) {
  const key = String(value || '').replace(/^\/+/, '');
  if (!key || key.includes('..')) throw new Error('A safe object key is required');
  return key;
}

export class S3CompatibleMediaStorage {
  constructor({ client, bucket, publicBaseUrl = '', ListObjectsV2Command }) {
    if (!client?.send) throw new Error('An S3-compatible client is required');
    if (!bucket) throw new Error('A media bucket is required');
    if (!ListObjectsV2Command) throw new Error('ListObjectsV2Command is required');
    this.client = client;
    this.bucket = bucket;
    this.publicBaseUrl = withoutTrailingSlash(publicBaseUrl);
    this.ListObjectsV2Command = ListObjectsV2Command;
  }

  async list({ prefix = '', maxKeys = 10 } = {}) {
    const boundedMaxKeys = Math.max(1, Math.min(100, Number(maxKeys) || 10));
    const result = await this.client.send(new this.ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: String(prefix || ''),
      MaxKeys: boundedMaxKeys
    }));
    return (result.Contents || []).map(item => ({
      key: item.Key,
      byteSize: Number(item.Size || 0),
      lastModified: item.LastModified || null,
      etag: item.ETag || null
    }));
  }

  publicUrl(key) {
    const safeKey = objectKey(key);
    if (!this.publicBaseUrl) return null;
    return `${this.publicBaseUrl}/${safeKey.split('/').map(encodeURIComponent).join('/')}`;
  }
}

export async function createMediaStorage({ env = process.env, client, ListObjectsV2Command } = {}) {
  const config = mediaStorageConfig(env);
  let resolvedClient = client;
  let ResolvedListCommand = ListObjectsV2Command;

  if (!resolvedClient || !ResolvedListCommand) {
    const sdk = await import('@aws-sdk/client-s3');
    resolvedClient ||= new sdk.S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    });
    ResolvedListCommand ||= sdk.ListObjectsV2Command;
  }

  return new S3CompatibleMediaStorage({
    client: resolvedClient,
    bucket: config.bucket,
    publicBaseUrl: config.publicBaseUrl,
    ListObjectsV2Command: ResolvedListCommand
  });
}
