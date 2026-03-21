import pino from 'pino';

let logger: pino.Logger = pino({ level: 'silent' });

export function initLogger(config: { level: string; serviceName: string; environment: string }) {
  logger = pino(
    {
      level: config.level,
      base: {
        service: config.serviceName,
        environment: config.environment,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    }),
  );
  return logger;
}

export { logger };
