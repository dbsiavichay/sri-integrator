import { Customer, Invoice, Line, OrderEvent, Payment, Product, SriConfig } from '../domain/models';
import { InvoiceDTO, OrderEventDTO } from '../app/dtos';
import { InvoiceSchema, OrderEventSchema } from './schemas';

import { Mapper } from '../app/mappers';

export abstract class BaseMapper<S, T> implements Mapper<S, T> {
  protected abstract map(entity: S): T;

  transform(entity: S): T;
  transform(array: S[]): T[];
  transform(entityOrArray: S | S[]): T | T[] {
    return Array.isArray(entityOrArray)
      ? entityOrArray.map((item: S) => this.map(item))
      : this.map(entityOrArray);
  }
}

export class InvoiceMapper extends BaseMapper<InvoiceDTO, Invoice> {
  protected map(dto: InvoiceDTO): Invoice {
    const parsedInput = InvoiceSchema.safeParse(dto);
    if (!parsedInput.success) {
      console.log(`ERRORS: ${parsedInput.error.stack}`);
      throw new Error(parsedInput.error.errors.join(', '));
    }
    const invoiceInput = parsedInput.data;
    const customer = new Customer(
      invoiceInput.customer.id,
      invoiceInput.customer.code,
      invoiceInput.customer.firstName,
      invoiceInput.customer.lastName,
      invoiceInput.customer.bussinessName,
      invoiceInput.customer.address,
      invoiceInput.customer.phone,
      invoiceInput.customer.email,
      invoiceInput.customer.codeType,
    );
    const lines = invoiceInput.lines.map(
      (invoiceLineInput) =>
        new Line(
          invoiceLineInput.id,
          new Product(
            invoiceLineInput.product.id,
            invoiceLineInput.product.code,
            invoiceLineInput.product.sku,
            invoiceLineInput.product.name,
            invoiceLineInput.product.shortName,
            invoiceLineInput.product.description,
            invoiceLineInput.product.isInventoried,
            invoiceLineInput.product.applyIva,
            invoiceLineInput.product.applyIce,
            invoiceLineInput.product.stock,
            invoiceLineInput.product.warehouseLocation,
            invoiceLineInput.product.type,
            invoiceLineInput.product.category,
            invoiceLineInput.product.measure,
            invoiceLineInput.product.provider,
            invoiceLineInput.product.taxes,
          ),
          invoiceLineInput.quantity,
          invoiceLineInput.unitPrice,
          invoiceLineInput.subtotal,
          invoiceLineInput.tax,
          invoiceLineInput.total,
        ),
    );

    const payments = invoiceInput.payments.map(
      (paymentInput) => new Payment(paymentInput.id, paymentInput.type, paymentInput.amount),
    );

    const sriConfig = new SriConfig(
      invoiceInput.sriConfig.companyCode,
      invoiceInput.sriConfig.companyName,
      invoiceInput.sriConfig.companyTradeName,
      invoiceInput.sriConfig.companyMainAddress,
      invoiceInput.sriConfig.companyBranchAddress,
      invoiceInput.sriConfig.companyBranchCode,
      invoiceInput.sriConfig.companySalePointCode,
      invoiceInput.sriConfig.specialTaxpayerResolution,
      invoiceInput.sriConfig.withholdingAgentResolution,
      invoiceInput.sriConfig.companyAccountingRequired,
      invoiceInput.sriConfig.environment,
      invoiceInput.sriConfig.emissionType,
    );

    return new Invoice(
      invoiceInput.id,
      lines,
      payments,
      sriConfig,
      new Date(invoiceInput.date),
      invoiceInput.authorizationDate ? new Date(invoiceInput.authorizationDate) : null,
      invoiceInput.voucherTypeCode,
      invoiceInput.accessCode,
      invoiceInput.companyBranchCode,
      invoiceInput.companySalePointCode,
      invoiceInput.sequence,
      invoiceInput.subtotal,
      invoiceInput.tax,
      invoiceInput.total,
      invoiceInput.status,
      invoiceInput.file,
      invoiceInput.errors,
      customer,
    );
  }
}

export class OrderEventMapper extends BaseMapper<OrderEventDTO, OrderEvent> {
  protected map(dto: OrderEventDTO): OrderEvent {
    const parsedInput = OrderEventSchema.safeParse(dto);
    if (!parsedInput.success) {
      throw new Error(parsedInput.error.errors.join(', '));
    }

    const orderEventInput = parsedInput.data;
    return new OrderEvent(
      orderEventInput.id,
      orderEventInput.access_code,
      orderEventInput.sequence,
    );
  }
}
