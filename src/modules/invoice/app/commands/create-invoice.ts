import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { CorePort, MessageProducer } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';

export interface OrderMessage {
  id: number;
  accessCode: string;
  sequence: string;
}

export interface InvoiceMessage {
  id: string;
  orderId: string;
  status: InvoiceStatus;
}

export class CreateInvoiceCommand {
  constructor(
    private corePort: CorePort,
    private invoiceRepository: InvoiceRepository,
    private messageProducer: MessageProducer<InvoiceMessage>,
  ) {}

  async execute(message: OrderMessage): Promise<void> {
    const order = await this.corePort.retrieveOrder(message.id);
    const xml = order.generateInvoiceXml();
    const invoice = new Invoice(
      undefined,
      order.id.toString(),
      order.accessCode,
      InvoiceStatus.CREATED,
      order.sriConfig.signature,
      xml,
    );
    invoice.addStatusHistory(InvoiceStatus.CREATED, new Date(), 'XML created');
    await this.invoiceRepository.createInvoice(invoice);
    await this.messageProducer.sendMessage({
      id: invoice.id,
      orderId: invoice.orderId,
      status: invoice.status,
    });
  }
}
