import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { MessageProducer, SriValidationPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { ValidationVoucherStatus } from '../../domain/voucher';
import { InvoiceMessage } from './create-invoice';

export class SendInvoiceCommand {
  constructor(
    private sriValidationPort: SriValidationPort,
    private invoiceRepository: InvoiceRepository,
    private messageProducer: MessageProducer<InvoiceMessage>,
  ) {}

  async execute(invoice: Invoice): Promise<void> {
    const validationVoucher = await this.sriValidationPort.validateXml(invoice.xml);
    const invoiceStatus =
      validationVoucher.status === ValidationVoucherStatus.ACCEPTED
        ? InvoiceStatus.SENT
        : InvoiceStatus.REJECTED;
    invoice.addStatusHistory(invoiceStatus, new Date(), validationVoucher.messages.join(' >> '));
    await this.invoiceRepository.updateInvoice(invoice);
    await this.messageProducer.sendMessage({
      id: invoice.id,
      orderId: invoice.orderId,
      status: invoice.status,
    });
  }
}
