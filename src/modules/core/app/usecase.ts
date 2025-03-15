import { CorePort } from '../domain/ports';
import { OrderEvent } from '../domain/models';

export class HandleMessage {
  constructor(private corePort: CorePort) {}

  async execute(message: OrderEvent) {
    const invoice = await this.corePort.retrieveInvoice(message.id);
    console.log('Processed Message:', invoice);
  }
}
