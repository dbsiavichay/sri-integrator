import { SoapClient } from '#/shared/infra/soap-client';
import { SriAuthorizationPort } from '../../domain/ports';
import { AuthorizationVoucher } from '../../domain/voucher';
import {
  mapAuthorizationVoucherToDomain,
  AuthorizationVoucherResponseDTO,
} from '../mappers/sri-authorization.mapper';

export class SriAuthorizationAdapter implements SriAuthorizationPort {
  constructor(private authorizationClient: SoapClient) {}

  async authorizeXml(code: string): Promise<AuthorizationVoucher> {
    const response = await this.authorizationClient.callMethod('autorizacionComprobante', {
      claveAccesoComprobante: code,
    });
    return mapAuthorizationVoucherToDomain(
      response.RespuestaAutorizacionComprobante as AuthorizationVoucherResponseDTO,
    );
  }
}
