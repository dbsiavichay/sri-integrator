import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { MessageProducer, SealifyPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { InvoiceMessage } from './create-invoice';

export class SignInvoiceCommand {
  constructor(
    private sealifyPort: SealifyPort,
    private invoiceRepository: InvoiceRepository,
    private messageProducer: MessageProducer<InvoiceMessage>,
  ) {}

  async execute(invoice: Invoice): Promise<void> {
    const signedXml = await this.sealifyPort.sealInvoice(invoice.xml, invoice.signatureId);
    invoice.xml = signedXml;
    invoice.addStatusHistory(InvoiceStatus.SIGNED, new Date(), 'XML signed');
    await this.invoiceRepository.updateInvoice(invoice);
    await this.messageProducer.sendMessage({
      id: invoice.id,
      orderId: invoice.orderId,
      status: invoice.status,
    });
  }
}
