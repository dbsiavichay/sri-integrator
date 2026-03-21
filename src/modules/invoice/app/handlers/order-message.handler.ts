import { CreateInvoiceCommand, OrderMessage } from '../commands/create-invoice';

export class OrderMessageHandler {
  constructor(private createInvoiceCommand: CreateInvoiceCommand) {}

  async handle(message: OrderMessage): Promise<void> {
    await this.createInvoiceCommand.execute(message);
  }
}
