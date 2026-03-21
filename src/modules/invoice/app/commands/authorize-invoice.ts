import { logger } from '#/shared/logger';

import { Invoice } from '../../domain/invoice';
import { SriAuthorizationPort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { AuthorizationVoucherStatus } from '../../domain/voucher';
import { InvoiceCommand } from './command';

export class AuthorizeInvoiceCommand implements InvoiceCommand {
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
    if (authorizationVoucher.status === AuthorizationVoucherStatus.AUTHORIZED) {
      invoice.authorize(authorizationVoucher.messages);
    } else {
      invoice.reject(authorizationVoucher.messages);
    }
    await this.invoiceRepository.updateInvoice(invoice);
    logger.info(
      { invoiceId: invoice.id, status: invoice.status },
      'Invoice authorization completed',
    );
  }
}
