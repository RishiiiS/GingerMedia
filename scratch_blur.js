const sharp = require('sharp');

const LAPLACIAN_KERNEL = {
  width: 3,
  height: 3,
  kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
  offset: 128
};

async function test(path) {
  try {
    const stats = await sharp(path)
      .resize(500)
      .greyscale()
      .convolve(LAPLACIAN_KERNEL)
      .stats();
    const stdev = stats.channels[0].stdev;
    console.log("Stdev:", stdev, "Variance:", stdev * stdev);
  } catch (e) {
    console.error(e);
  }
}

test('/Users/rishiseth/Desktop/car.jpg');
