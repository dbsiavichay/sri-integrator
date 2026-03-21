import { InvoiceDomainEvent } from '../../domain/events';
import { InvoiceStatus } from '../../domain/invoice';
import { MessageProducer } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { InvoiceMessage } from '../../infra/messaging/schemas';
import { AuthorizeInvoiceCommand } from '../commands/authorize-invoice';
import { SendInvoiceCommand } from '../commands/send-invoice';
import { SignInvoiceCommand } from '../commands/sign-invoice';
import { logger } from '#/shared/logger';

export class InvoiceMessageHandler {
  constructor(
    private invoiceRepository: InvoiceRepository,
    private signInvoiceCommand: SignInvoiceCommand,
    private sendInvoiceCommand: SendInvoiceCommand,
    private authorizeInvoiceCommand: AuthorizeInvoiceCommand,
    private messageProducer: MessageProducer<InvoiceDomainEvent>,
  ) {}

  async handle(message: InvoiceMessage): Promise<void> {
    const invoice = await this.invoiceRepository.getInvoiceById(message.invoiceId);
    if (!invoice) {
      logger.warn({ invoiceId: message.invoiceId }, 'Invoice not found');
      return;
    }

    if ([InvoiceStatus.REJECTED, InvoiceStatus.AUTHORIZED].includes(invoice.status)) {
      logger.warn({ invoiceId: message.invoiceId }, 'Invoice already processed');
      return;
    }

    if (invoice.status === InvoiceStatus.CREATED) {
      await this.signInvoiceCommand.execute(invoice);
    } else if (invoice.status === InvoiceStatus.SIGNED) {
      await this.sendInvoiceCommand.execute(invoice);
    } else if (invoice.status === InvoiceStatus.SENT) {
      await this.authorizeInvoiceCommand.execute(invoice);
    }

    for (const event of invoice.pullEvents()) {
      await this.messageProducer.sendMessage(event);
    }
  }
}
