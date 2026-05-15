const pino = require('pino');
const env = require('./env');

const isDevelopment = env.nodeEnv === 'development';

const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
      {
        target: 'pino/file',
        options: { destination: './logs/app.log' },
      },
    ],
  },
});

module.exports = logger;
