const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const ImageProcessing = require('../models/image.model');
const ProcessingLog = require('../models/processingLog.model');
const imageQueue = require('../queue/image.queue');
const logger = require('../config/logger');

const uploadImage = async (req, res) => {
  try {
    // 1. Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    const file = req.file;
    const processingId = uuidv4();
    
    logger.info(`[UPLOAD] Upload received: processingId=${processingId}, originalName=${file.originalname}`);

    // 2. Extract Metadata using Sharp
    let metadata;
    try {
      metadata = await sharp(file.path).metadata();
      logger.info(`[UPLOAD] Metadata extracted: processingId=${processingId}`);
    } catch (error) {
      logger.error(`[UPLOAD] Metadata extraction failed: processingId=${processingId}, error=${error.message}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid image file or metadata extraction failed',
      });
    }

    // 3. Save MongoDB Record
    let imageRecord;
    try {
      imageRecord = new ImageProcessing({
        processingId,
        originalFileName: file.originalname,
        storedFileName: file.filename,
        localPath: file.path,
        mimeType: file.mimetype,
        fileSize: file.size,
        imageMetadata: {
          width: metadata.width,
          height: metadata.height,
        },
        status: 'pending',
      });
      await imageRecord.save();

      // Log the upload stage
      await ProcessingLog.create({
        processingId,
        stage: 'upload',
        status: 'success',
        message: 'Image uploaded and saved to database',
        metadata: {
          mimeType: file.mimetype,
          size: file.size,
        }
      });
      logger.info(`[UPLOAD] DB record saved: processingId=${processingId}`);
    } catch (error) {
      logger.error(`[UPLOAD] DB save failed: processingId=${processingId}, error=${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to save image record to database',
      });
    }

    // 4. Enqueue Job
    try {
      await imageQueue.add(
        'process-image',
        {
          processingId,
          localPath: file.path,
        },
        { jobId: processingId } // Important: Prevents duplicate queue jobs and improves debugging
      );
      logger.info(`[UPLOAD] Job queued: processingId=${processingId}`);
    } catch (error) {
      logger.error(`[UPLOAD] Queue enqueue failed: processingId=${processingId}, error=${error.message}`);
      
      // Update DB to failed if enqueue fails
      imageRecord.status = 'failed';
      imageRecord.failureReason = 'Failed to enqueue processing job';
      await imageRecord.save();

      await ProcessingLog.create({
        processingId,
        stage: 'upload',
        status: 'failed',
        message: 'Failed to enqueue processing job',
        error: error.message
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to enqueue image processing job',
      });
    }

    // 5. Return Success Immediately
    return res.status(202).json({
      success: true,
      processingId,
      status: 'pending',
      message: 'Image uploaded successfully and queued for processing',
    });

  } catch (error) {
    logger.error(`[UPLOAD] Unexpected error: error=${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during upload',
    });
  }
};

module.exports = {
  uploadImage,
};
