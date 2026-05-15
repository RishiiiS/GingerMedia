const sharp = require('sharp');

async function test(path) {
  try {
    const { data, info } = await sharp(path)
      .resize(400) // Standardize resolution to 400px width
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width;
    const height = info.height;
    
    let sum = 0;
    let sumSq = 0;
    let count = 0;

    // Laplacian kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const top = data[(y - 1) * width + x];
        const bottom = data[(y + 1) * width + x];
        const left = data[y * width + (x - 1)];
        const right = data[y * width + (x + 1)];
        const center = data[y * width + x];

        const laplacian = top + bottom + left + right - 4 * center;
        
        sum += laplacian;
        sumSq += laplacian * laplacian;
        count++;
      }
    }

    const mean = sum / count;
    const variance = (sumSq / count) - (mean * mean);
    
    console.log("Image:", path);
    console.log("Variance:", variance);
  } catch (e) {
    console.error(e);
  }
}

test('/Users/rishiseth/Desktop/car.jpg');
