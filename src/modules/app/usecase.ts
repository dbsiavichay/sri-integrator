import {
  AuthorizationVoucherStatus,
  InvoiceStatus,
  ValidationVoucherStatus,
} from '../domain/constants';
import {
  CorePort,
  MessageProducer,
  SealifyPort,
  SriAuthorizationPort,
  SriValidationPort,
} from '../domain/ports';
import { Invoice, InvoiceMessage, OrderMessage } from '../domain/models';

import { GenerateVoucherXmlService } from '../domain/services';
import { InvoiceRepository } from '../domain/repositories';

export interface ProcessMessageUseCase<T> {
  execute(message: T): Promise<void>;
}

export class ProcessOrderMessage implements ProcessMessageUseCase<OrderMessage> {
  constructor(
    private service: GenerateVoucherXmlService,
    private corePort: CorePort,
    private invoiceRepository: InvoiceRepository,
    private messageProducer: MessageProducer<InvoiceMessage>,
  ) {}

  async execute(message: OrderMessage) {
    const order = await this.corePort.retrieveOrder(message.id);
    const xml = this.service.generate(order);
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
    await this.messageProducer.sendMessage(
      new InvoiceMessage(invoice.id, invoice.orderId, invoice.status),
    );
  }
}

export class ProcessInvoiceMessage implements ProcessMessageUseCase<InvoiceMessage> {
  constructor(
    private sealifyPort: SealifyPort,
    private sriValidationPort: SriValidationPort,
    private sriAuthorizationPort: SriAuthorizationPort,
    private invoiceRepository: InvoiceRepository,
    private messageProducer: MessageProducer<InvoiceMessage>,
  ) {}

  async execute(message: InvoiceMessage) {
    const invoice = await this.invoiceRepository.getInvoiceById(message.id);
    if (!invoice) {
      console.warn(`⚠️ Invoice not found: ${message.id}`);
      return;
    }

    if ([InvoiceStatus.REJECTED, InvoiceStatus.AUTHORIZED].includes(invoice.status)) {
      console.warn(`⚠️ Invoice already processed: ${message.id}`);
      return;
    }

    if (invoice.status === InvoiceStatus.CREATED) {
      const signedXml = await this.sealifyPort.sealInvoice(invoice.xml, invoice.signatureId);
      invoice.xml = signedXml;
      invoice.addStatusHistory(InvoiceStatus.SIGNED, new Date(), 'XML signed');
    } else if (invoice.status === InvoiceStatus.SIGNED) {
      const validationVoucher = await this.sriValidationPort.validateXml(invoice.xml);
      const invoiceStatus =
        validationVoucher.status === ValidationVoucherStatus.ACCEPTED
          ? InvoiceStatus.SENT
          : InvoiceStatus.REJECTED;
      invoice.addStatusHistory(invoiceStatus, new Date(), validationVoucher.messages.join(' >> '));
    } else if (invoice.status === InvoiceStatus.SENT) {
      const authorizationVoucher = await this.sriAuthorizationPort.authorizeXml(invoice.accessCode);
      const invoiceStatus =
        authorizationVoucher.status === AuthorizationVoucherStatus.AUTHORIZED
          ? InvoiceStatus.AUTHORIZED
          : InvoiceStatus.REJECTED;
      invoice.addStatusHistory(
        invoiceStatus,
        new Date(),
        authorizationVoucher.messages.join(' >> '),
      );
    }
    await this.invoiceRepository.updateInvoice(invoice);
    await this.messageProducer.sendMessage(
      new InvoiceMessage(invoice.id, invoice.orderId, invoice.status),
    );
  }
}
