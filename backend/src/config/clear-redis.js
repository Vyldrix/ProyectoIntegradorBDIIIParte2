const redisClient = require('./redis');

async function clearCache() {
  try {
    await redisClient.flushAll();
    console.log('Redis cache cleared successfully.');
  } catch (error) {
    console.error('Error clearing Redis cache:', error);
  } finally {
    process.exit(0);
  }
}

clearCache();
