import { AccessCode } from '../../domain/access-code';
import { Invoice } from '../../domain/invoice';
import { buildInvoiceXml } from '../../domain/invoice-xml-builder';
import { CorePort } from '../../domain/ports';
import { InvoiceRepository } from '../../domain/repository';
import { CreateInvoiceInput } from '../types';

export class CreateInvoiceCommand {
  constructor(
    private corePort: CorePort,
    private invoiceRepository: InvoiceRepository,
  ) {}

  async execute(message: CreateInvoiceInput): Promise<Invoice> {
    const order = await this.corePort.retrieveOrder(message.id);
    const xml = buildInvoiceXml({
      environment: parseInt(order.sriConfig.environment),
      emissionType: parseInt(order.sriConfig.emissionType),
      companyName: order.sriConfig.companyName,
      companyTradeName: order.sriConfig.companyTradeName,
      companyCode: order.sriConfig.companyCode,
      companyMainAddress: order.sriConfig.companyMainAddress,
      companyBranchAddress: order.sriConfig.companyBranchAddress,
      companyBranchCode: order.sriConfig.companyBranchCode,
      companySalePointCode: order.sriConfig.companySalePointCode,
      companyAccountingRequired: order.sriConfig.companyAccountingRequired,
      accessCode: order.accessCode,
      sequence: order.sequence,
      voucherTypeCode: order.voucherTypeCode,
      date: order.date,
      customer: {
        taxIdCode: order.customer.codeType,
        name: order.customer.bussinessName,
        taxId: order.customer.code,
        email: order.customer.email,
        phone: order.customer.phone,
        address: order.customer.address,
      },
      subtotal: order.subtotal,
      totalDiscount: 0,
      total: order.total,
      payments: order.payments.map((p) => ({ formaPago: p.type, amount: p.amount })),
      items: order.lines.map((line) => ({
        productId: line.product.code,
        sku: line.product.sku,
        description: line.product.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: 0,
        subtotal: line.subtotal,
        taxCodigoPorcentaje: 4,
        taxRate: 15,
        taxAmount: line.tax,
      })),
    });
    const invoice = Invoice.create(
      order.id.toString(),
      AccessCode.create(order.accessCode),
      order.sriConfig.signature,
      xml,
    );
    await this.invoiceRepository.createInvoice(invoice);
    return invoice;
  }
}
