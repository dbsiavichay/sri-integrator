import { InvoiceStatus } from '../../domain/invoice';
import { InvoiceRepository } from '../../domain/repository';
import { AuthorizeInvoiceCommand } from '../commands/authorize-invoice';
import { InvoiceMessage } from '../commands/create-invoice';
import { SendInvoiceCommand } from '../commands/send-invoice';
import { SignInvoiceCommand } from '../commands/sign-invoice';
import { logger } from '#/shared/logger';

export class InvoiceMessageHandler {
  constructor(
    private invoiceRepository: InvoiceRepository,
    private signInvoiceCommand: SignInvoiceCommand,
    private sendInvoiceCommand: SendInvoiceCommand,
    private authorizeInvoiceCommand: AuthorizeInvoiceCommand,
  ) {}

  async handle(message: InvoiceMessage): Promise<void> {
    const invoice = await this.invoiceRepository.getInvoiceById(message.id);
    if (!invoice) {
      logger.warn({ invoiceId: message.id }, 'Invoice not found');
      return;
    }

    if ([InvoiceStatus.REJECTED, InvoiceStatus.AUTHORIZED].includes(invoice.status)) {
      logger.warn({ invoiceId: message.id }, 'Invoice already processed');
      return;
    }

    if (invoice.status === InvoiceStatus.CREATED) {
      await this.signInvoiceCommand.execute(invoice);
    } else if (invoice.status === InvoiceStatus.SIGNED) {
      await this.sendInvoiceCommand.execute(invoice);
    } else if (invoice.status === InvoiceStatus.SENT) {
      await this.authorizeInvoiceCommand.execute(invoice);
    }
  }
}
