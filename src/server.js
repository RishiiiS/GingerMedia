const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
require('./config/redis'); // Initialize redis client

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.port, () => {
      logger.info(`Server is running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
