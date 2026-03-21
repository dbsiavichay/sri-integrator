import { SoapClient } from '#/shared/infra/soap-client';

import { SriValidationPort } from '../../domain/ports';
import { ValidationVoucher } from '../../domain/voucher';
import {
  mapValidationVoucherToDomain,
  ReceiptVoucherResponseDTO,
} from '../mappers/sri-validation.mapper';

export class SriValidationAdapter implements SriValidationPort {
  constructor(private validateClient: SoapClient) {}

  async validateXml(xml: string): Promise<ValidationVoucher> {
    xml = Buffer.from(xml, 'utf-8').toString('base64');
    const response = (await this.validateClient.callMethod('validarComprobante', {
      xml,
    })) as { RespuestaRecepcionComprobante: ReceiptVoucherResponseDTO };
    return mapValidationVoucherToDomain(response.RespuestaRecepcionComprobante);
  }
}
