import { CorePort, MessageProducer, SealifyPort } from '../domain/ports';
import { Invoice, InvoiceMessage, OrderEvent } from '../domain/models';

import { GenerateVoucherXmlService } from '../domain/services';
import { InvoiceRepository } from '../domain/repositories';
import { InvoiceStatus } from '../domain/constants';

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
      InvoiceStatus.GENERATED,
      order.sriConfig.signature,
      xml,
    );
    await this.invoiceRepository.createInvoice(invoice);
    await this.messageProducer.sendMessage(
      new InvoiceMessage(invoice.id, invoice.orderId, invoice.status),
    );
  }
}

export class ProcessInvoiceMessage implements ProcessMessageUseCase<InvoiceMessage> {
  constructor(
    private sealifyPort: SealifyPort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(message: InvoiceMessage) {
    const invoice = await this.invoiceRepository.getInvoiceById(message.id);
    const signedXml = await this.sealifyPort.sealInvoice(invoice.xml, invoice.signatureId);
    invoice.signedXml = signedXml;
    invoice.status = InvoiceStatus.SIGNED;
    await this.invoiceRepository.updateInvoice(invoice);
  }
}
