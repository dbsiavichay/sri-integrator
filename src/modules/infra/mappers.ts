import { Customer, Line, Order, OrderEvent, Payment, Product, SriConfig } from '../domain/models';
import { InvoiceMessageDTO, OrderDTO, OrderEventDTO } from '../app/dtos';
import { InvoiceMessageSchema, OrderEventSchema, OrderSchema } from './schemas';

import { InvoiceMessage } from '../domain/models';
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

export class OrderMapper extends BaseMapper<OrderDTO, Order> {
  protected map(dto: OrderDTO): Order {
    const parsedInput = OrderSchema.safeParse(dto);
    if (!parsedInput.success) {
      console.log(`ERRORS: ${parsedInput.error.stack}`);
      throw new Error(parsedInput.error.errors.join(', '));
    }
    const orderInput = parsedInput.data;
    const customer = new Customer(
      orderInput.customer.id,
      orderInput.customer.code,
      orderInput.customer.firstName,
      orderInput.customer.lastName,
      orderInput.customer.bussinessName,
      orderInput.customer.address,
      orderInput.customer.phone,
      orderInput.customer.email,
      orderInput.customer.codeType,
    );
    const lines = orderInput.lines.map(
      (lineInput) =>
        new Line(
          lineInput.id,
          new Product(
            lineInput.product.id,
            lineInput.product.code,
            lineInput.product.sku,
            lineInput.product.name,
            lineInput.product.shortName,
            lineInput.product.description,
            lineInput.product.isInventoried,
            lineInput.product.applyIva,
            lineInput.product.applyIce,
            lineInput.product.stock,
            lineInput.product.warehouseLocation,
            lineInput.product.type,
            lineInput.product.category,
            lineInput.product.measure,
            lineInput.product.provider,
            lineInput.product.taxes,
          ),
          lineInput.quantity,
          lineInput.unitPrice,
          lineInput.subtotal,
          lineInput.tax,
          lineInput.total,
        ),
    );

    const payments = orderInput.payments.map(
      (paymentInput) => new Payment(paymentInput.id, paymentInput.type, paymentInput.amount),
    );

    const sriConfig = new SriConfig(
      orderInput.sriConfig.companyCode,
      orderInput.sriConfig.companyName,
      orderInput.sriConfig.companyTradeName,
      orderInput.sriConfig.companyMainAddress,
      orderInput.sriConfig.companyBranchAddress,
      orderInput.sriConfig.companyBranchCode,
      orderInput.sriConfig.companySalePointCode,
      orderInput.sriConfig.specialTaxpayerResolution,
      orderInput.sriConfig.withholdingAgentResolution,
      orderInput.sriConfig.companyAccountingRequired,
      orderInput.sriConfig.environment,
      orderInput.sriConfig.emissionType,
      orderInput.sriConfig.signature,
    );

    return new Order(
      orderInput.id,
      lines,
      payments,
      sriConfig,
      new Date(orderInput.date),
      orderInput.authorizationDate ? new Date(orderInput.authorizationDate) : null,
      orderInput.voucherTypeCode,
      orderInput.accessCode,
      orderInput.companyBranchCode,
      orderInput.companySalePointCode,
      orderInput.sequence,
      orderInput.subtotal,
      orderInput.tax,
      orderInput.total,
      orderInput.status,
      orderInput.file,
      orderInput.errors,
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

export class InvoiceMessageMapper extends BaseMapper<InvoiceMessageDTO, InvoiceMessage> {
  protected map(dto: InvoiceMessageDTO): InvoiceMessage {
    const parsedInput = InvoiceMessageSchema.safeParse(dto);
    if (!parsedInput.success) {
      throw new Error(parsedInput.error.errors.join(', '));
    }

    const invoiceMessageInput = parsedInput.data;
    return new InvoiceMessage(
      invoiceMessageInput.id,
      invoiceMessageInput.orderId,
      invoiceMessageInput.status,
      invoiceMessageInput.signatureId,
    );
  }
}
