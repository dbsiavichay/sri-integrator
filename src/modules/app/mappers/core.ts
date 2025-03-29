import 'reflect-metadata';

import { Customer, Line, Order, Payment, Product, SriConfig } from '#/modules/domain/models';

import { AutoRegisterMapper } from './decorator';
import { BaseMapper } from './base';
import { OrderDTO } from '../dtos';

@AutoRegisterMapper('order')
export class OrderMapper extends BaseMapper<OrderDTO, Order> {
  mapToDomain(dto: OrderDTO): Order {
    const customer = new Customer(
      dto.customer.id,
      dto.customer.code,
      dto.customer.firstName,
      dto.customer.lastName,
      dto.customer.bussinessName,
      dto.customer.address,
      dto.customer.phone,
      dto.customer.email,
      dto.customer.codeType,
    );
    const lines = dto.lines.map(
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
            lineInput.product.taxes,
          ),
          lineInput.quantity,
          lineInput.unitPrice,
          lineInput.subtotal,
          lineInput.tax,
          lineInput.total,
        ),
    );

    const payments = dto.payments.map(
      (paymentInput) => new Payment(paymentInput.id, paymentInput.type, paymentInput.amount),
    );

    const sriConfig = new SriConfig(
      dto.sriConfig.companyCode,
      dto.sriConfig.companyName,
      dto.sriConfig.companyTradeName,
      dto.sriConfig.companyMainAddress,
      dto.sriConfig.companyBranchAddress,
      dto.sriConfig.companyBranchCode,
      dto.sriConfig.companySalePointCode,
      dto.sriConfig.specialTaxpayerResolution,
      dto.sriConfig.withholdingAgentResolution,
      dto.sriConfig.companyAccountingRequired,
      dto.sriConfig.environment,
      dto.sriConfig.emissionType,
      dto.sriConfig.signature,
    );

    return new Order(
      dto.id,
      lines,
      payments,
      sriConfig,
      new Date(dto.date),
      dto.authorizationDate ? new Date(dto.authorizationDate) : null,
      dto.voucherTypeCode,
      dto.accessCode,
      dto.companyBranchCode,
      dto.companySalePointCode,
      dto.sequence,
      dto.subtotal,
      dto.tax,
      dto.total,
      dto.status,
      dto.file,
      dto.errors,
      customer,
    );
  }
}
