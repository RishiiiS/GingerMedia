const Redis = require('ioredis');
const env = require('./env');
const logger = require('./logger');

const redisConfig = {
  host: env.redisHost,
  port: env.redisPort,
  // maxRetriesPerRequest must be null for BullMQ
  maxRetriesPerRequest: null,
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info('[REDIS] Connecting to Redis...');
});

redisClient.on('ready', () => {
  logger.info('[REDIS] Redis client is ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('[REDIS] Reconnecting to Redis...');
});

redisClient.on('error', (err) => {
  logger.error(`[REDIS] Redis error: ${err.message}`);
});

module.exports = redisClient;
