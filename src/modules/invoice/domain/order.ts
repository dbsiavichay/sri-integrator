import { DateTime } from 'luxon';
import { create } from 'xmlbuilder2';

export class Product {
  constructor(
    public id: number,
    public code: string,
    public sku: string,
    public name: string,
    public shortName: string,
    public description: string,
    public isInventoried: boolean,
    public applyIva: boolean,
    public applyIce: boolean,
    public stock: number,
    public warehouseLocation: string,
    public type: string,
    public taxes: number[],
  ) {}
}

export class Customer {
  constructor(
    public id: number,
    public code: string,
    public firstName: string | null,
    public lastName: string | null,
    public bussinessName: string,
    public address: string | null,
    public phone: string | null,
    public email: string,
    public codeType: string,
  ) {}
}

export class Line {
  constructor(
    public id: number,
    public product: Product,
    public quantity: number,
    public unitPrice: number,
    public subtotal: number,
    public tax: number,
    public total: number,
  ) {}
}

export class Payment {
  constructor(
    public id: number,
    public type: string,
    public amount: number,
  ) {}
}

export class SriConfig {
  constructor(
    public companyCode: string,
    public companyName: string,
    public companyTradeName: string,
    public companyMainAddress: string,
    public companyBranchAddress: string,
    public companyBranchCode: string,
    public companySalePointCode: string,
    public specialTaxpayerResolution: string,
    public withholdingAgentResolution: string,
    public companyAccountingRequired: boolean,
    public environment: string,
    public emissionType: string,
    public signature: string,
  ) {}
}

export class Order {
  constructor(
    public id: number,
    public lines: Line[],
    public payments: Payment[],
    public sriConfig: SriConfig,
    public date: Date,
    public authorizationDate: Date | null,
    public voucherTypeCode: string,
    public accessCode: string,
    public companyBranchCode: string,
    public companySalePointCode: string,
    public sequence: string,
    public subtotal: number,
    public tax: number,
    public total: number,
    public status: string,
    public file: any | null,
    public errors: Record<string, any>,
    public customer: Customer,
  ) {}

  public generateInvoiceXml(): string {
    return generateInvoiceXml(this);
  }
}

function getInvoiceData(order: Order) {
  const adjustedVoucherDate = DateTime.fromJSDate(order.date);
  const customer = order.customer;
  const payments = order.payments;
  const lines = order.lines;

  const data = {
    factura: {
      '@id': 'comprobante',
      '@version': '1.0.0',
      infoTributaria: {
        ambiente: order.sriConfig.environment,
        tipoEmision: order.sriConfig.emissionType,
        razonSocial: order.sriConfig.companyName,
        nombreComercial: order.sriConfig.companyTradeName,
        ruc: order.sriConfig.companyCode,
        claveAcceso: order.accessCode,
        codDoc: order.voucherTypeCode,
        estab: order.companyBranchCode,
        ptoEmi: order.companySalePointCode,
        secuencial: order.sequence,
        dirMatriz: order.sriConfig.companyMainAddress,
      },
      infoFactura: {
        fechaEmision: adjustedVoucherDate.toFormat('dd/MM/yyyy'),
        dirEstablecimiento: order.sriConfig.companyBranchAddress,
        obligadoContabilidad: order.sriConfig.companyAccountingRequired ? 'SI' : 'NO',
        tipoIdentificacionComprador: order.customer.codeType,
        razonSocialComprador: order.customer.bussinessName,
        identificacionComprador: order.customer.code,
        totalSinImpuestos: order.subtotal,
        totalDescuento: 0,
        totalConImpuestos: {
          totalImpuesto: [
            {
              codigo: 2,
              codigoPorcentaje: 4,
              baseImponible: order.subtotal,
              valor: order.tax,
            },
          ],
        },
        propina: 0,
        importeTotal: order.total,
        moneda: 'DOLAR',
        pagos: { pago: [] as any[] },
      },
      detalles: { detalle: [] as any[] },
      infoAdicional: { campoAdicional: [] as any[] },
    },
  };

  if (customer.address) {
    data.factura.infoAdicional.campoAdicional.push({
      '@nombre': 'Dirección',
      '#text': customer.address,
    });
  }

  if (customer.phone) {
    data.factura.infoAdicional.campoAdicional.push({
      '@nombre': 'Telefono',
      '#text': customer.phone,
    });
  }

  data.factura.infoAdicional.campoAdicional.push({
    '@nombre': 'Email',
    '#text': customer.email,
  });

  payments.forEach((payment) => {
    data.factura.infoFactura.pagos.pago.push({
      formaPago: payment.type,
      total: payment.amount,
      plazo: 0,
      unidadTiempo: 'dias',
    });
  });

  lines.forEach((line) => {
    data.factura.detalles.detalle.push({
      codigoPrincipal: line.product.code,
      codigoAuxiliar: line.product.sku,
      descripcion: line.product.name,
      cantidad: line.quantity,
      precioUnitario: line.unitPrice,
      descuento: 0,
      precioTotalSinImpuesto: line.subtotal,
      impuestos: {
        impuesto: [
          {
            codigo: 2,
            codigoPorcentaje: 4,
            tarifa: 15,
            baseImponible: line.subtotal,
            valor: line.tax,
          },
        ],
      },
    });
  });

  return data;
}

function generateInvoiceXml(order: Order): string {
  const data = getInvoiceData(order);
  return create(data).end({ prettyPrint: true });
}
