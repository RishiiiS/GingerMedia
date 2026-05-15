const mongoose = require('mongoose');

const processingLogSchema = new mongoose.Schema(
  {
    // Link to the main ImageProcessing document
    processingId: {
      type: String,
      required: true,
      index: true,
    },
    // The specific step in the pipeline
    stage: {
      type: String,
      required: true,
      enum: [
        'upload',
        'processing-started',
        'metadata-extraction',
        'blur-check',
        'brightness-check',
        'duplicate-check',
        'number-plate-check',
        'processing-completed',
        'processing-failed',
      ],
    },
    // Outcome of the current stage
    status: {
      type: String,
      required: true,
      enum: ['started', 'success', 'failed'],
    },
    // Human-readable debugging info
    message: {
      type: String,
      trim: true,
      default: '',
    },
    // Failure reason if the stage failed
    error: {
      type: String,
      default: null,
    },
    // Optional debugging context (e.g., heuristics scores, dimensions)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Supports chronological log retrieval for debugging
processingLogSchema.index({ processingId: 1, createdAt: 1 });

const ProcessingLog = mongoose.model('ProcessingLog', processingLogSchema);

module.exports = ProcessingLog;
