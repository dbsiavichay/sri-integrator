import { InvoiceDomainEvent } from '../../domain/events';
import { MessageProducer } from '../../domain/ports';
import { SaleConfirmedMessage } from '../../infra/messaging/schemas';
import { CreateInvoiceCommand } from '../commands/create-invoice';

export class SaleConfirmedHandler {
  constructor(
    private createInvoiceCommand: CreateInvoiceCommand,
    private messageProducer: MessageProducer<InvoiceDomainEvent>,
  ) {}

  async handle(message: SaleConfirmedMessage): Promise<void> {
    const invoice = await this.createInvoiceCommand.execute(message);
    for (const event of invoice.pullEvents()) {
      await this.messageProducer.sendMessage(event);
    }
  }
}
