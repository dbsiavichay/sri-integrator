import { AppConfig } from '../config';
import { PinoLogger } from '#/modules/infra/adapters';

export function initLogger(config: AppConfig) {
  return PinoLogger.getInstance(config);
}

export function getLogger() {
  return PinoLogger.getInstance();
}
