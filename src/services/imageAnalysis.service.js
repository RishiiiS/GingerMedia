const sharp = require('sharp');

/**
 * Image Analysis Service
 * Uses 'sharp' to extract deterministic image heuristics.
 */


// We use a standardized width so high-resolution noise doesn't inflate the score.
// A typical laplacian variance threshold for blur is between 100 and 300.
const BLUR_THRESHOLD = 200; 
const BRIGHTNESS_THRESHOLD = 80; // 0-255 scale, < 80 is considered quite dark

const analyzeBlur = async (imagePath) => {
  try {
    // 1. Standardize the image (Resize + Greyscale)
    // 2. Extract raw pixels. We avoid using sharp's `.convolve` because it strictly 
    //    clamps pixel values to 0-255, completely ruining mathematical variance.
    const { data, info } = await sharp(imagePath)
      .resize(400) // Standardize resolution to 400px width
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    // 3. Compute Laplacian: [0, 1, 0, 1, -4, 1, 0, 1, 0]
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const top = data[(y - 1) * width + x];
        const bottom = data[(y + 1) * width + x];
        const left = data[y * width + (x - 1)];
        const right = data[y * width + (x + 1)];
        const center = data[y * width + x];

        // The Laplacian detects edges. Negative values are expected and preserved here.
        const laplacian = top + bottom + left + right - 4 * center;
        
        sum += laplacian;
        sumSq += laplacian * laplacian;
        count++;
      }
    }

    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);

    return {
      detected: variance < BLUR_THRESHOLD, // true if blurry
      score: Math.round(variance * 100) / 100, // Round to 2 decimal places
      threshold: BLUR_THRESHOLD,
    };
  } catch (error) {
    throw new Error(`Blur analysis failed: ${error.message}`);
  }
};

const analyzeBrightness = async (imagePath) => {
  try {
    const stats = await sharp(imagePath)
      .greyscale() // Convert to greyscale to get accurate lightness
      .stats();

    // Mean gives the average pixel brightness (0 = black, 255 = white)
    const averageBrightness = stats.channels[0].mean;

    return {
      detected: averageBrightness < BRIGHTNESS_THRESHOLD, // true if low light
      averageBrightness: Math.round(averageBrightness * 100) / 100,
      threshold: BRIGHTNESS_THRESHOLD,
    };
  } catch (error) {
    throw new Error(`Brightness analysis failed: ${error.message}`);
  }
};

module.exports = {
  analyzeBlur,
  analyzeBrightness,
};
