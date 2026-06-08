const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Connect to Redis immediately
(async () => {
  try {
    await client.connect();
    console.log('Connected to Redis');
  } catch (err) {
    console.error('Failed to connect to Redis', err);
  }
})();

// Safe Wrappers for Fallback Mechanism
const safeClient = {
  get: async (key) => {
    if (!client.isOpen) return null;
    try {
      return await client.get(key);
    } catch (err) {
      console.error(`[Redis Fallback] Error getting key ${key}:`, err.message);
      return null; // Force Cache MISS to fallback to DB
    }
  },
  setEx: async (key, ttl, value) => {
    if (!client.isOpen) return;
    try {
      await client.setEx(key, ttl, value);
    } catch (err) {
      console.error(`[Redis Fallback] Error setting key ${key}:`, err.message);
    }
  },
  del: async (key) => {
    if (!client.isOpen) return;
    try {
      await client.del(key);
    } catch (err) {
      console.error(`[Redis Fallback] Error deleting key ${key}:`, err.message);
    }
  },
  original: client
};

module.exports = safeClient;
