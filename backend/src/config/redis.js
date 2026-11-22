import Redis from 'ioredis';

let redisClient = null;
let isRedisConnected = false;

export const initRedis = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      retryStrategy(times) {
        if (times > 3) {
          // Cease aggressive retries to prevent console spam when Redis isn't hosted locally
          return null;
        }
        return Math.min(times * 1000, 3000);
      },
      lazyConnect: true,
    });

    redisClient.connect().then(() => {
      isRedisConnected = true;
      console.log('[Cache] Redis Connected successfully.');
    }).catch((err) => {
      isRedisConnected = false;
      console.warn(`[Cache Warning] Redis connection failed (${err.message}). Active fallback to MongoDB direct queries enabled.`);
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });
  } catch (err) {
    isRedisConnected = false;
    console.warn('[Cache Warning] Redis initialization failed. Using MongoDB direct failover.');
  }

  return redisClient;
};

export const getRedisClient = () => redisClient;
export const getIsRedisConnected = () => isRedisConnected;
