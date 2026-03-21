import { InvoiceDomainEvent } from '../../domain/events';
import { MessageProducer } from '../../domain/ports';
import { OrderMessage } from '../../infra/messaging/schemas';
import { CreateInvoiceCommand } from '../commands/create-invoice';

export class OrderMessageHandler {
  constructor(
    private createInvoiceCommand: CreateInvoiceCommand,
    private messageProducer: MessageProducer<InvoiceDomainEvent>,
  ) {}

  async handle(message: OrderMessage): Promise<void> {
    const invoice = await this.createInvoiceCommand.execute(message);
    for (const event of invoice.pullEvents()) {
      await this.messageProducer.sendMessage(event);
    }
  }
}
