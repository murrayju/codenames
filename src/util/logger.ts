import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  level: 'debug',
  transports: [new winston.transports.File({ filename: './log/server.log' })],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export default logger;
