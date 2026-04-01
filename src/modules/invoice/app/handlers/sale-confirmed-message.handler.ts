import { logger } from '#/shared/logger';

export class SaleConfirmedMessageHandler {
  async handle(message: unknown): Promise<void> {
    logger.info({ event: message }, 'Sale confirmed event received');
  }
}
