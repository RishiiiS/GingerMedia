const mongoose = require('mongoose');

// Schema for basic image metadata like dimensions
const imageMetadataSchema = new mongoose.Schema(
  {
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false } // Disable _id for nested subdocuments
);

// Schema for blur detection results
const blurAnalysisSchema = new mongoose.Schema(
  {
    detected: { type: Boolean },
    score: { type: Number },
    threshold: { type: Number },
  },
  { _id: false }
);

// Schema for brightness/low-light results
const brightnessAnalysisSchema = new mongoose.Schema(
  {
    detected: { type: Boolean },
    averageBrightness: { type: Number },
    threshold: { type: Number },
  },
  { _id: false }
);

// Schema for duplicate detection results
const duplicateAnalysisSchema = new mongoose.Schema(
  {
    detected: { type: Boolean },
    matchedProcessingId: { type: String },
    similarity: { type: Number },
  },
  { _id: false }
);

// Schema for OCR number plate results
const numberPlateAnalysisSchema = new mongoose.Schema(
  {
    detected: { type: Boolean },
    extractedText: { type: String },
    validFormat: { type: Boolean },
  },
  { _id: false }
);

// Master schema for aggregated analysis results
const analysisResultsSchema = new mongoose.Schema(
  {
    blur: blurAnalysisSchema,
    brightness: brightnessAnalysisSchema,
    duplicate: duplicateAnalysisSchema,
    numberPlate: numberPlateAnalysisSchema,
  },
  { _id: false }
);

const imageProcessingSchema = new mongoose.Schema(
  {
    // 1. Upload Information Fields
    processingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    storedFileName: {
      type: String,
      required: true,
      trim: true,
    },
    localPath: {
      type: String,
      required: true,
    },

    // 2. File Metadata Fields
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },

    // 3. Nested Image Metadata
    imageMetadata: {
      type: imageMetadataSchema,
      default: {},
    },

    // 4. Processing Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      required: true,
      index: true,
    },

    // 5. Image Hash Field
    imageHash: {
      type: String,
      index: true,
    },

    // 6. Analysis Results Object
    analysisResults: {
      type: analysisResultsSchema,
      default: {},
    },

    // 7. Failure Handling
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    // 8. Timestamps
    timestamps: true,
  }
);

const ImageProcessing = mongoose.model('ImageProcessing', imageProcessingSchema);

module.exports = ImageProcessing;
