const express = require('express');
const upload = require('../config/multer');
const { uploadImage } = require('../controllers/upload.controller');

const router = express.Router();

// Handle multer upload with custom error capturing for invalid file types
const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }
    
    // Additional strict validation for jpg/jpeg/png
    if (req.file) {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type. Only JPG, JPEG, and PNG are allowed.',
        });
      }
    }
    
    next();
  });
};

router.post('/', uploadMiddleware, uploadImage);

module.exports = router;
