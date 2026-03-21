import { logger } from '#/shared/logger';

import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { SriAuthorizationPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { AuthorizationVoucherStatus } from '../../domain/voucher';

export class AuthorizeInvoiceCommand {
  constructor(
    private sriAuthorizationPort: SriAuthorizationPort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(invoice: Invoice): Promise<void> {
    logger.info(
      { invoiceId: invoice.id, accessCode: invoice.accessCode.value },
      'Authorizing invoice',
    );
    const authorizationVoucher = await this.sriAuthorizationPort.authorizeXml(
      invoice.accessCode.value,
    );
    const invoiceStatus =
      authorizationVoucher.status === AuthorizationVoucherStatus.AUTHORIZED
        ? InvoiceStatus.AUTHORIZED
        : InvoiceStatus.REJECTED;
    invoice.addStatusHistory(invoiceStatus, new Date(), authorizationVoucher.messages.join(' >> '));
    await this.invoiceRepository.updateInvoice(invoice);
    logger.info(
      { invoiceId: invoice.id, status: invoiceStatus },
      'Invoice authorization completed',
    );
  }
}
