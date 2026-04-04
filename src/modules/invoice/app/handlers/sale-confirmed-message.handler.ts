import { InvoiceDomainEvent } from '../../domain/events';
import { MessageProducer } from '../../domain/ports';
import { SaleConfirmedMessage } from '../../infra/messaging/schemas';
import { CreateInvoiceFromSaleCommand } from '../commands/create-invoice-from-sale';

export class SaleConfirmedMessageHandler {
  constructor(
    private createInvoiceFromSaleCommand: CreateInvoiceFromSaleCommand,
    private messageProducer: MessageProducer<InvoiceDomainEvent>,
  ) {}

  async handle(message: SaleConfirmedMessage): Promise<void> {
    const invoice = await this.createInvoiceFromSaleCommand.execute(message);
    for (const event of invoice.pullEvents()) {
      await this.messageProducer.sendMessage(event);
    }
  }
}
