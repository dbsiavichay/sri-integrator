import { AppConfig } from '#/config';
import { Logger } from '../../domain/ports';
import pino from 'pino';

export class PinoLogger implements Logger {
  private static instance: PinoLogger;
  private logger: pino.Logger;

  private constructor(config: AppConfig) {
    const { serviceName, environment } = config;
    const { level } = config.logger;
    const pinoConfig: pino.LoggerOptions = {
      level,
      base: {
        service: serviceName,
        environment,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    this.logger = pino(
      pinoConfig,
      pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        },
      }),
    );
  }

  public static getInstance(config?: AppConfig): PinoLogger {
    if (!PinoLogger.instance && config) {
      PinoLogger.instance = new PinoLogger(config);
    } else if (!PinoLogger.instance && !config) {
      throw new Error('Se requiere configuración para inicializar el logger');
    }
    return PinoLogger.instance;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context || {}, message);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context || {}, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context || {}, message);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.logger.error(context || {}, message);
  }

  fatal(message: string, context?: Record<string, unknown>): void {
    this.logger.fatal(context || {}, message);
  }
}
