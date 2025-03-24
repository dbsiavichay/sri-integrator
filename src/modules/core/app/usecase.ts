import { CorePort } from '../domain/ports';
import { GenerateVoucherXmlService } from '../domain/services';
import { OrderEvent } from '../domain/models';

export class HandleMessage {
  constructor(
    private corePort: CorePort,
    private service: GenerateVoucherXmlService,
  ) {}

  async execute(message: OrderEvent) {
    const invoice = await this.corePort.retrieveInvoice(message.id);
    console.log('Processed Message:', invoice);
    const xml = this.service.generate(invoice);
    console.log('Generated XML:', xml);
  }
}
