import {
  AuthorizationVoucher,
  Customer,
  Invoice,
  InvoiceStatusHistory,
  Line,
  Order,
  OrderEvent,
  Payment,
  Product,
  SriConfig,
  ValidationVoucher,
} from '../domain/models';
import {
  AuthorizationVoucherResponseDTO,
  InvoiceDTO,
  ReceiptVoucherResponseDTO,
} from './data-transfer-object';
import {
  AuthorizationVoucherStatus,
  InvoiceStatus,
  ValidationVoucherStatus,
} from '../domain/constants';
import { InvoiceMessageDTO, OrderDTO, OrderEventDTO } from '../app/dtos';
import { InvoiceMessageSchema, OrderEventSchema, OrderSchema } from './schemas';

import { InvoiceMessage } from '../domain/models';

export interface Mapper<S, T> {
  transform(entity: S): T;
  transform(array: S[]): T[];
  transform(entityOrArray: S | S[]): T | T[];
}

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
    );
  }
}

export class ValidationVoucherMapper extends BaseMapper<
  ReceiptVoucherResponseDTO,
  ValidationVoucher
> {
  protected map(dto: ReceiptVoucherResponseDTO): ValidationVoucher {
    const voucher = dto.comprobantes?.comprobante?.[0];

    return new ValidationVoucher(
      this.mapStatus(dto.estado),
      voucher?.claveAcceso ?? null,
      voucher?.mensajes?.mensaje?.map(
        (m) => `${m.tipo} ${m.identificador} : ${m.mensaje} : ${m.informacionAdicional}`,
      ) ?? [],
    );
  }

  private mapStatus(status: string): ValidationVoucherStatus {
    switch (status) {
      case 'RECIBIDA':
        return ValidationVoucherStatus.ACCEPTED;
      case 'DEVUELTA':
        return ValidationVoucherStatus.REJECTED;
      default:
        throw new Error(`Not supported status: ${status}`);
    }
  }
}

export class AuthorizationVoucherMapper extends BaseMapper<
  AuthorizationVoucherResponseDTO,
  AuthorizationVoucher
> {
  protected map(dto: AuthorizationVoucherResponseDTO): AuthorizationVoucher {
    const authorization = dto.autorizaciones?.autorizacion?.[0];

    return new AuthorizationVoucher(
      authorization ? this.mapStatus(authorization.estado) : null,
      dto.claveAccesoConsultada,
      authorization?.fechaAutorizacion ? new Date(authorization.fechaAutorizacion) : null,
      authorization?.mensajes?.mensaje?.map(
        (m) => `${m.tipo} ${m.identificador} : ${m.mensaje} : ${m.informacionAdicional}`,
      ) ?? [],
    );
  }

  private mapStatus(status: string): AuthorizationVoucherStatus {
    switch (status) {
      case 'AUTORIZADO':
        return AuthorizationVoucherStatus.AUTHORIZED;
      case 'NO AUTORIZADO':
        return AuthorizationVoucherStatus.REJECTED;
      default:
        throw new Error(`Not supported status: ${status}`);
    }
  }
}

export class InvoiceMapper extends BaseMapper<InvoiceDTO, Invoice> {
  protected map(dto: InvoiceDTO): Invoice {
    return new Invoice(
      dto.id,
      dto.orderId,
      dto.accessCode,
      dto.status as InvoiceStatus,
      dto.signatureId,
      dto.xml,
      dto.statusHistory.map(
        (h) => new InvoiceStatusHistory(h.name as InvoiceStatus, new Date(h.date), h.description),
      ),
      dto.signedXml ?? '',
      dto.authorizedXml ?? '',
    );
  }

  toDTO(entity: Invoice): InvoiceDTO {
    return {
      id: entity.id,
      orderId: entity.orderId,
      accessCode: entity.accessCode,
      status: entity.status,
      signatureId: entity.signatureId,
      xml: entity.xml,
      statusHistory: entity.statusHistory.map((h) => ({
        name: h.name,
        date: h.date.toISOString(),
        description: h.description ?? '',
      })),
      signedXml: entity.signedXml ?? '',
      authorizedXml: entity.authorizedXml ?? '',
    };
  }
}
