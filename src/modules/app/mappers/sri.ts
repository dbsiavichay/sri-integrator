import { AuthorizationVoucher, ValidationVoucher } from '#/modules/domain/models';
import { AuthorizationVoucherResponseDTO, ReceiptVoucherResponseDTO } from '../dtos/sri';
import { AuthorizationVoucherStatus, ValidationVoucherStatus } from '#/modules/domain/constants';

import { AutoRegisterMapper } from './decorator';
import { BaseMapper } from './base';

@AutoRegisterMapper('validationVoucher')
export class ValidationVoucherMapper extends BaseMapper<
  ReceiptVoucherResponseDTO,
  ValidationVoucher
> {
  mapToDomain(dto: ReceiptVoucherResponseDTO): ValidationVoucher {
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

@AutoRegisterMapper('authorizationVoucher')
export class AuthorizationVoucherMapper extends BaseMapper<
  AuthorizationVoucherResponseDTO,
  AuthorizationVoucher
> {
  mapToDomain(dto: AuthorizationVoucherResponseDTO): AuthorizationVoucher {
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
