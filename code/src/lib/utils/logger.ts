import pino from 'pino';

const logLevel = (process.env.LOG_LEVEL || 'info') as string;

export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: false,
    },
  },
});

// Request context logger with correlation ID
export function createRequestLogger(requestId: string) {
  return logger.child({
    request_id: requestId,
  });
}

export default logger;
