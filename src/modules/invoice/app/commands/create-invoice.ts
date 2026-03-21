import { AccessCode } from '../../domain/access-code';
import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { CorePort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { OrderMessage } from '../../infra/messaging/schemas';

export class CreateInvoiceCommand {
  constructor(
    private corePort: CorePort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(message: OrderMessage): Promise<Invoice> {
    const order = await this.corePort.retrieveOrder(message.id);
    const xml = order.generateInvoiceXml();
    const invoice = new Invoice(
      undefined,
      order.id.toString(),
      AccessCode.create(order.accessCode),
      InvoiceStatus.CREATED,
      order.sriConfig.signature,
      xml,
    );
    invoice.addStatusHistory(InvoiceStatus.CREATED, new Date(), 'XML created');
    await this.invoiceRepository.createInvoice(invoice);
    return invoice;
  }
}
