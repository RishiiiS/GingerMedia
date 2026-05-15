const { Worker } = require('bullmq');
const fs = require('fs');
const ImageProcessing = require('../models/image.model');
const ProcessingLog = require('../models/processingLog.model');
const redisClient = require('../config/redis');
const logger = require('../config/logger');
const imageAnalysisService = require('../services/imageAnalysis.service');

// The core worker logic
const processImageJob = async (job) => {
  const { processingId, localPath } = job.data;
  
  logger.info(`[WORKER] Picked up job: processingId=${processingId}`);

  // 1. Update DB to processing
  let imageRecord = await ImageProcessing.findOne({ processingId });
  if (!imageRecord) {
    throw new Error(`Database record not found for processingId: ${processingId}`);
  }

  imageRecord.status = 'processing';
  await imageRecord.save();

  await ProcessingLog.create({
    processingId,
    stage: 'processing-started',
    status: 'success',
    message: 'Background processing started'
  });

  try {
    // 2. Validate File Exists
    if (!fs.existsSync(localPath)) {
      throw new Error(`Uploaded image file not found at ${localPath}`);
    }
    logger.info(`[WORKER] File validated successfully: processingId=${processingId}`);

    // --- REAL IMAGE ANALYSIS LAYER ---
    
    // 1. Blur Detection
    let blurResult;
    try {
      logger.info(`[WORKER] Running blur analysis: processingId=${processingId}`);
      blurResult = await imageAnalysisService.analyzeBlur(localPath);
      
      logger.info(`[WORKER] Blur score: ${blurResult.score}`);
      logger.info(`[WORKER] Blur detected: ${blurResult.detected}`);

      await ProcessingLog.create({
        processingId,
        stage: 'blur-check',
        status: 'success',
        message: blurResult.detected ? 'Image detected as blurry' : 'Image is sharp',
        metadata: blurResult
      });
    } catch (err) {
      logger.error(`[WORKER] Blur detection failed: ${err.message}`);
      await ProcessingLog.create({
        processingId,
        stage: 'blur-check',
        status: 'failed',
        message: 'Blur analysis failed',
        error: err.message
      });
    }

    // 2. Brightness Detection
    let brightnessResult;
    try {
      logger.info(`[WORKER] Running brightness analysis: processingId=${processingId}`);
      brightnessResult = await imageAnalysisService.analyzeBrightness(localPath);
      await ProcessingLog.create({
        processingId,
        stage: 'brightness-check',
        status: 'success',
        message: brightnessResult.detected ? 'Image detected as low-light' : 'Image brightness is acceptable',
        metadata: brightnessResult
      });
    } catch (err) {
      logger.error(`[WORKER] Brightness detection failed: ${err.message}`);
      await ProcessingLog.create({
        processingId,
        stage: 'brightness-check',
        status: 'failed',
        message: 'Brightness analysis failed',
        error: err.message
      });
    }

    // 3. Complete Flow & Save Results
    if (blurResult || brightnessResult) {
      imageRecord.analysisResults = {
        ...(blurResult && { blur: blurResult }),
        ...(brightnessResult && { brightness: brightnessResult })
      };
    }

    imageRecord.status = 'completed';
    await imageRecord.save();

    await ProcessingLog.create({
      processingId,
      stage: 'processing-completed',
      status: 'success',
      message: 'Image processing completed successfully'
    });
    
    logger.info(`[WORKER] Processing completed: processingId=${processingId}`);

  } catch (error) {
    // 5. Failure Handling
    logger.error(`[WORKER] Processing failed: processingId=${processingId}, error=${error.message}`);
    
    imageRecord.status = 'failed';
    imageRecord.failureReason = error.message;
    await imageRecord.save();

    await ProcessingLog.create({
      processingId,
      stage: 'processing-failed',
      status: 'failed',
      message: error.message,
      error: error.stack
    });

    // Re-throw so BullMQ explicitly marks the job as failed in Redis
    throw error;
  }
};

// Initialize BullMQ Worker
const imageWorker = new Worker('image-processing', processImageJob, {
  connection: redisClient,
});

imageWorker.on('ready', () => {
  logger.info('[WORKER] Image processing worker is ready and listening for jobs');
});

imageWorker.on('error', (err) => {
  logger.error(`[WORKER] Worker encountered an error: ${err.message}`);
});

module.exports = imageWorker;
