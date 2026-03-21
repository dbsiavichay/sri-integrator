import { AccessCode } from '../../domain/access-code';
import { Invoice } from '../../domain/invoice';
import { buildInvoiceXml } from '../../domain/invoice-xml-builder';
import { CorePort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { CreateInvoiceInput } from '../types';

export class CreateInvoiceCommand {
  constructor(
    private corePort: CorePort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(message: CreateInvoiceInput): Promise<Invoice> {
    const order = await this.corePort.retrieveOrder(message.id);
    const xml = buildInvoiceXml(order);
    const invoice = Invoice.create(
      order.id.toString(),
      AccessCode.create(order.accessCode),
      order.sriConfig.signature,
      xml,
    );
    await this.invoiceRepository.createInvoice(invoice);
    return invoice;
  }
}
