import {
  AuthorizationVoucherStatus,
  InvoiceStatus,
  ValidationVoucherStatus,
} from '../domain/constants';
import { CorePort, MessageProducer, SealifyPort, SriPort } from '../domain/ports';
import { Invoice, InvoiceMessage, OrderEvent } from '../domain/models';

import { GenerateVoucherXmlService } from '../domain/services';
import { InvoiceRepository } from '../domain/repositories';

export interface ProcessMessageUseCase<T> {
  execute(message: T): Promise<void>;
}

export class ProcessOrderEventMessage implements ProcessMessageUseCase<OrderEvent> {
  constructor(
    private service: GenerateVoucherXmlService,
    private corePort: CorePort,
    private invoiceRepository: InvoiceRepository,
    private messageProducer: MessageProducer<InvoiceMessage>,
  ) {}

  async execute(message: OrderEvent) {
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
    invoice.addStatusHistory(InvoiceStatus.CREATED);
    await this.invoiceRepository.createInvoice(invoice);
    await this.messageProducer.sendMessage(
      new InvoiceMessage(invoice.id, invoice.orderId, invoice.status),
    );
  }
}

export class ProcessInvoiceMessage implements ProcessMessageUseCase<InvoiceMessage> {
  constructor(
    private sealifyPort: SealifyPort,
    private sriPort: SriPort,
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
      invoice.signedXml = signedXml;
      invoice.status = InvoiceStatus.SIGNED;
    } else if (invoice.status === InvoiceStatus.SIGNED) {
      const validationVoucher = await this.sriPort.validateXml(invoice.signedXml ?? '');
      const invoiceStatus =
        validationVoucher.status === ValidationVoucherStatus.ACCEPTED
          ? InvoiceStatus.SENT
          : InvoiceStatus.REJECTED;
      invoice.status = invoiceStatus;
      invoice.addStatusHistory(invoiceStatus, new Date(), validationVoucher.messages.join(' >> '));
    } else if (invoice.status === InvoiceStatus.SENT) {
      const authorizationVoucher = await this.sriPort.authorizeXml(invoice.accessCode);
      const invoiceStatus =
        authorizationVoucher.status === AuthorizationVoucherStatus.AUTHORIZED
          ? InvoiceStatus.AUTHORIZED
          : InvoiceStatus.REJECTED;
      invoice.status = invoiceStatus;
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
