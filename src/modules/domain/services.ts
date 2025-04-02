import { DateTime } from 'luxon';
import { Order } from './models';
import { create } from 'xmlbuilder2';

export class GenerateInvoiceXml {
  private static getData(order: Order) {
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

    // Agrega información adicional del cliente
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

  public static generate(order: Order): string {
    const data = this.getData(order);
    const xml = create(data).end({ prettyPrint: true });
    return xml;
  }
}
