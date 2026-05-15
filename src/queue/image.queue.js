const { Queue, QueueEvents } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../config/logger');

const QUEUE_NAME = 'image-processing';

// 1. Initialize Queue
const imageQueue = new Queue(QUEUE_NAME, {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // Starts with a 2 second delay (2s, 4s, 8s...)
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours max
      count: 100,     // Or up to 100 jobs, whichever comes first
    },
    removeOnFail: {
      age: 24 * 3600, // Keep failed jobs for 24 hours max
      count: 50,      // Keep last 50 failed jobs to prevent bloat but allow debugging
    },
  },
});

// 2. Queue Observability (Events)
const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisClient,
});

queueEvents.on('waiting', ({ jobId }) => {
  logger.info(`[QUEUE] Job waiting: jobId=${jobId}`);
});

queueEvents.on('active', ({ jobId }) => {
  logger.info(`[QUEUE] Job active: processingId=${jobId}`);
});

queueEvents.on('completed', ({ jobId }) => {
  logger.info(`[QUEUE] Job completed: processingId=${jobId}`);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`[QUEUE] Job failed: processingId=${jobId}, reason=${failedReason}`);
});

queueEvents.on('stalled', ({ jobId }) => {
  logger.warn(`[QUEUE] Job stalled: processingId=${jobId}`);
});

module.exports = imageQueue;
