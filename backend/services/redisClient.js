
// utils/redisClient.js
const { createClient } = require('redis');
const { Redis } = require('ioredis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000, // 5 seconds
    lazyConnect: true, // Don't connect immediately
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('⚠️ Redis connection failed after 10 retries, continuing without Redis');
        return false; // Stop retrying
      }
      return Math.min(retries * 100, 3000); // Exponential backoff
    }
  }
});

redisClient.on('error', (err) => {
  console.log('⚠️ Redis Client Error (continuing without cache):', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected');
});

redisClient.on('ready', () => {
  console.log('✅ Redis ready');
});

redisClient.on('end', () => {
  console.log('⚠️ Redis connection ended');
});

// Connect to Redis but don't block the application if it fails
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.log('⚠️ Could not connect to Redis, continuing without cache:', error.message);
  }
})();

// IORedis connection for Bull MQ
const bullMQConnection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 10) {
      console.log('⚠️ Bull MQ Redis connection failed after 10 retries');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

bullMQConnection.on('connect', () => {
  console.log('✅ Bull MQ Redis connected');
});

bullMQConnection.on('error', (err) => {
  console.log('⚠️ Bull MQ Redis error:', err.message);
});

module.exports = redisClient;
module.exports.bullMQConnection = bullMQConnection;
