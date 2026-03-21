import { logger } from '#/shared/logger';

import { Invoice } from '../../domain/invoice';
import { SriValidationPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { ValidationVoucherStatus } from '../../domain/voucher';
import { InvoiceCommand } from './command';

export class SendInvoiceCommand implements InvoiceCommand {
  constructor(
    private sriValidationPort: SriValidationPort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(invoice: Invoice): Promise<void> {
    logger.info({ invoiceId: invoice.id }, 'Sending invoice to SRI');
    const validationVoucher = await this.sriValidationPort.validateXml(invoice.xml);
    if (validationVoucher.status === ValidationVoucherStatus.ACCEPTED) {
      invoice.markAsSent(validationVoucher.messages);
    } else {
      invoice.reject(validationVoucher.messages);
    }
    await this.invoiceRepository.updateInvoice(invoice);
    logger.info({ invoiceId: invoice.id, status: invoice.status }, 'Invoice sent to SRI');
  }
}
