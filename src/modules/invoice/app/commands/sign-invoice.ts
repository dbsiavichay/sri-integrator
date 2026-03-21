import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { SealifyPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';

export class SignInvoiceCommand {
  constructor(
    private sealifyPort: SealifyPort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(invoice: Invoice): Promise<void> {
    const signedXml = await this.sealifyPort.sealInvoice(invoice.xml, invoice.signatureId);
    invoice.xml = signedXml;
    invoice.addStatusHistory(InvoiceStatus.SIGNED, new Date(), 'XML signed');
    await this.invoiceRepository.updateInvoice(invoice);
  }
}
