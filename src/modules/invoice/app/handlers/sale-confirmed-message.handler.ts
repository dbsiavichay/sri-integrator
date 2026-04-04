import { logger } from '#/shared/logger';

import { SaleConfirmedMessage } from '../../infra/messaging/schemas';

export class SaleConfirmedMessageHandler {
  async handle(message: SaleConfirmedMessage): Promise<void> {
    logger.info({ event: message }, 'Sale confirmed event received');
  }
}
