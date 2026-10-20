import mongoose from 'mongoose';

export function createConnectionManager(
  driver,
  getUri = () => process.env.MONGODB_URI,
) {
  let connecting = null;
  let lastFailure = null;
  const configuredUri = () => {
    const value = getUri()?.trim() || '';
    // Dashboard environment values sometimes include copied wrapping quotes.
    return value.length > 1 &&
      ['"', "'"].includes(value[0]) &&
      value.at(-1) === value[0]
      ? value.slice(1, -1).trim()
      : value;
  };
  const classify = (error) => {
    if (
      error.name === 'MongoParseError' ||
      error.name === 'MongoInvalidArgumentError'
    )
      return 'invalid_configuration';
    if (
      [18, 8000].includes(error.code) ||
      /authentication failed|bad auth/i.test(error.message || '')
    )
      return 'authentication_failed';
    if (
      [
        'MongoServerSelectionError',
        'MongooseServerSelectionError',
        'MongoNetworkError',
      ].includes(error.name) ||
      ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'].includes(error.code)
    )
      return 'network_unreachable';
    return 'connection_failed';
  };
  return {
    async connect() {
      if (driver.connection.readyState === 1) return;
      if (connecting) return connecting;
      const uri = configuredUri();
      if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
        lastFailure = uri ? 'invalid_configuration' : 'missing_configuration';
        throw new Error(
          'MongoDB connection configuration is missing or invalid.',
        );
      }
      connecting = (async () => {
        try {
          if (driver.connection.readyState === 2)
            await driver.connection.asPromise();
          else
            await driver.connect(uri, {
              serverSelectionTimeoutMS: 10000,
              connectTimeoutMS: 10000,
              maxPoolSize: 10,
              // Each serverless instance owns a pool. Release unused sockets
              // so warm instances do not retain them against Atlas's limit.
              minPoolSize: 0,
              maxIdleTimeMS: 60000,
            });
          lastFailure = null;
        } catch (error) {
          lastFailure = classify(error);
          throw error;
        } finally {
          connecting = null;
        }
      })();
      return connecting;
    },
    status() {
      const connected = driver.connection.readyState === 1;
      return {
        configured: Boolean(configuredUri()),
        state:
          ['disconnected', 'connected', 'connecting', 'disconnecting'][
            driver.connection.readyState
          ] || 'unknown',
        issue: connected ? null : lastFailure,
      };
    },
  };
}
export const mongoConnection = createConnectionManager(mongoose);
