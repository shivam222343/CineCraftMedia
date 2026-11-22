import { getRedisClient, getIsRedisConnected } from '../config/redis.js';

export const CacheKeys = {
  THEME: 'cms:theme:v1',
  CONTENT: 'cms:content:v1',
  ANALYTICS: 'admin:analytics:summary',
};

const DEFAULT_TTL = parseInt(process.env.REDIS_TTL_SECONDS || '3600', 10);

/**
 * Fetch cached JSON value from Redis with failover support
 */
export const getCached = async (key) => {
  if (!getIsRedisConnected()) return null;
  const client = getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.warn(`[Cache Warning] Failed to get key ${key}: ${err.message}`);
    return null;
  }
};

/**
 * Store JSON value in Redis with TTL
 */
export const setCached = async (key, value, ttl = DEFAULT_TTL) => {
  if (!getIsRedisConnected()) return false;
  const client = getRedisClient();
  if (!client) return false;

  try {
    const serialized = JSON.stringify(value);
    await client.set(key, serialized, 'EX', ttl);
    return true;
  } catch (err) {
    console.warn(`[Cache Warning] Failed to set key ${key}: ${err.message}`);
    return false;
  }
};

/**
 * Invalidate a specific Redis key or group of keys
 */
export const invalidateCache = async (...keys) => {
  if (!getIsRedisConnected()) return;
  const client = getRedisClient();
  if (!client) return;

  try {
    for (const key of keys) {
      await client.del(key);
      console.log(`[Cache Invalidation] Flushed key: ${key}`);
    }
  } catch (err) {
    console.warn(`[Cache Invalidation Error] Failed to delete keys: ${err.message}`);
  }
};
