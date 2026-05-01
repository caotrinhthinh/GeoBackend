const { createClient } = require('redis');

let redisClient = null;
let connectPromise = null;

function getRedisUrl() {
  return process.env.REDIS_URL || 'redis://127.0.0.1:6379';
}

function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: getRedisUrl(),
    });

    redisClient.on('error', (error) => {
      console.error('Redis client error:', error.message);
    });
  }

  return redisClient;
}

async function connectRedis() {
  const client = getRedisClient();
  if (client.isOpen) {
    return client;
  }

  if (!connectPromise) {
    connectPromise = client.connect().finally(() => {
      connectPromise = null;
    });
  }

  await connectPromise;
  return client;
}

module.exports = {
  getRedisClient,
  connectRedis,
};
