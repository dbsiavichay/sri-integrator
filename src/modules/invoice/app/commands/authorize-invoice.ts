import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { MessageProducer, SriAuthorizationPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { AuthorizationVoucherStatus } from '../../domain/voucher';
import { InvoiceMessage } from './create-invoice';

export class AuthorizeInvoiceCommand {
  constructor(
    private sriAuthorizationPort: SriAuthorizationPort,
    private invoiceRepository: InvoiceRepository,
    private messageProducer: MessageProducer<InvoiceMessage>,
  ) {}

  async execute(invoice: Invoice): Promise<void> {
    const authorizationVoucher = await this.sriAuthorizationPort.authorizeXml(invoice.accessCode);
    const invoiceStatus =
      authorizationVoucher.status === AuthorizationVoucherStatus.AUTHORIZED
        ? InvoiceStatus.AUTHORIZED
        : InvoiceStatus.REJECTED;
    invoice.addStatusHistory(invoiceStatus, new Date(), authorizationVoucher.messages.join(' >> '));
    await this.invoiceRepository.updateInvoice(invoice);
    await this.messageProducer.sendMessage({
      id: invoice.id,
      orderId: invoice.orderId,
      status: invoice.status,
    });
  }
}
