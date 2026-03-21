import pino from 'pino';

let logger: pino.Logger = pino({ level: 'silent' });

export function initLogger(config: { level: string; serviceName: string; environment: string }) {
  const isLocal = config.environment === 'local';

  logger = pino({
    level: config.level,
    base: isLocal ? undefined : { service: config.serviceName, environment: config.environment },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(isLocal && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      },
    }),
  });

  return logger;
}

export { logger };
