import { logger } from '#/shared/logger';

import { InvoiceDomainEvent } from '../../domain/events';
import { InvoiceStatus } from '../../domain/invoice';
import { MessageProducer } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { InvoiceCommand } from '../commands/command';
import { InvoiceMessageInput } from '../types';

export class InvoiceEventHandler {
  constructor(
    private invoiceRepository: InvoiceRepository,
    private commandMap: Map<InvoiceStatus, InvoiceCommand>,
    private messageProducer: MessageProducer<InvoiceDomainEvent>,
  ) {}

  async handle(message: InvoiceMessageInput): Promise<void> {
    const invoice = await this.invoiceRepository.getInvoiceById(message.invoiceId);
    if (!invoice) {
      logger.warn({ invoiceId: message.invoiceId }, 'Invoice not found');
      return;
    }

    if ([InvoiceStatus.REJECTED, InvoiceStatus.AUTHORIZED].includes(invoice.status)) {
      logger.warn({ invoiceId: message.invoiceId }, 'Invoice already processed');
      return;
    }

    const command = this.commandMap.get(invoice.status);
    if (!command) {
      logger.warn(
        { invoiceId: message.invoiceId, status: invoice.status },
        'No command for status',
      );
      return;
    }

    await command.execute(invoice);

    for (const event of invoice.pullEvents()) {
      await this.messageProducer.sendMessage(event);
    }
  }
}
