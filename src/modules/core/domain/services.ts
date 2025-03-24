import { DateTime } from 'luxon';
import { Invoice } from './models';
import { create } from 'xmlbuilder2';

export class GenerateVoucherXmlService {
  constructor(private timeZone: string) {}

  private getData(invoice: Invoice): any {
    const adjustedVoucherDate = DateTime.fromJSDate(invoice.date).setZone(this.timeZone).toJSDate();
    const customer = invoice.customer;
    const payments = invoice.payments;
    const lines = invoice.lines;

    const data = {
      factura: {
        '@id': 'comprobante',
        '@version': '1.0.0',
        infoTributaria: {
          ambiente: invoice.sriConfig.environment,
          tipoEmision: invoice.sriConfig.emissionType,
          razonSocial: invoice.sriConfig.companyName,
          nombreComercial: invoice.sriConfig.companyTradeName,
          ruc: invoice.sriConfig.companyCode,
          claveAcceso: invoice.accessCode,
          codDoc: invoice.voucherTypeCode,
          estab: invoice.companyBranchCode,
          ptoEmi: invoice.companySalePointCode,
          secuencial: invoice.sequence,
          dirMatriz: invoice.sriConfig.companyMainAddress,
        },
        infoFactura: {
          fechaEmision: adjustedVoucherDate.toISOString().substr(0, 10),
          dirEstablecimiento: invoice.sriConfig.companyBranchAddress,
          obligadoContabilidad: invoice.sriConfig.companyAccountingRequired ? 'SI' : 'NO',
          tipoIdentificacionComprador: invoice.customer.codeType,
          razonSocialComprador: invoice.customer.bussinessName,
          identificacionComprador: invoice.customer.code,
          totalSinImpuestos: invoice.subtotal,
          totalDescuento: 0,
          totalConImpuestos: [
            {
              codigo: 2,
              codigoPorcentaje: 4,
              baseImponible: invoice.subtotal,
              valor: invoice.tax,
            },
          ],
          propina: 0,
          importeTotal: invoice.total,
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

  public generate(invoice: Invoice): string {
    const data = this.getData(invoice);
    const xml = create(data).end({ prettyPrint: true });
    return xml;
  }
}
