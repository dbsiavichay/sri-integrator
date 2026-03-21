import { logger } from '#/shared/logger';

import { Invoice, InvoiceStatus } from '../../domain/invoice';
import { SriValidationPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { ValidationVoucherStatus } from '../../domain/voucher';

export class SendInvoiceCommand {
  constructor(
    private sriValidationPort: SriValidationPort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(invoice: Invoice): Promise<void> {
    logger.info({ invoiceId: invoice.id }, 'Sending invoice to SRI');
    const validationVoucher = await this.sriValidationPort.validateXml(invoice.xml);
    const invoiceStatus =
      validationVoucher.status === ValidationVoucherStatus.ACCEPTED
        ? InvoiceStatus.SENT
        : InvoiceStatus.REJECTED;
    invoice.addStatusHistory(invoiceStatus, new Date(), validationVoucher.messages.join(' >> '));
    await this.invoiceRepository.updateInvoice(invoice);
    logger.info({ invoiceId: invoice.id, status: invoiceStatus }, 'Invoice sent to SRI');
  }
}
