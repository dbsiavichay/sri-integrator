import { AuthorizationVoucher, ValidationVoucher } from '#/modules/domain/models';
import { AuthorizationVoucherResponseDTO, ReceiptVoucherResponseDTO } from '../dtos/sri';
import { AuthorizationVoucherStatus, ValidationVoucherStatus } from '#/modules/domain/constants';

function mapValidationStatus(status: string): ValidationVoucherStatus {
  switch (status) {
    case 'RECIBIDA':
      return ValidationVoucherStatus.ACCEPTED;
    case 'DEVUELTA':
      return ValidationVoucherStatus.REJECTED;
    default:
      throw new Error(`Not supported status: ${status}`);
  }
}

export function mapValidationVoucherToDomain(dto: ReceiptVoucherResponseDTO): ValidationVoucher {
  const voucher = dto.comprobantes?.comprobante?.[0];

  return new ValidationVoucher(
    mapValidationStatus(dto.estado),
    voucher?.claveAcceso ?? null,
    voucher?.mensajes?.mensaje?.map(
      (m) => `${m.tipo} ${m.identificador} : ${m.mensaje} : ${m.informacionAdicional}`,
    ) ?? [],
  );
}

function mapAuthorizationStatus(status: string): AuthorizationVoucherStatus {
  switch (status) {
    case 'AUTORIZADO':
      return AuthorizationVoucherStatus.AUTHORIZED;
    case 'NO AUTORIZADO':
      return AuthorizationVoucherStatus.REJECTED;
    default:
      throw new Error(`Not supported status: ${status}`);
  }
}

export function mapAuthorizationVoucherToDomain(
  dto: AuthorizationVoucherResponseDTO,
): AuthorizationVoucher {
  const authorization = dto.autorizaciones?.autorizacion?.[0];

  return new AuthorizationVoucher(
    authorization ? mapAuthorizationStatus(authorization.estado) : null,
    dto.claveAccesoConsultada,
    authorization?.fechaAutorizacion ? new Date(authorization.fechaAutorizacion) : null,
    authorization?.mensajes?.mensaje?.map(
      (m) => `${m.tipo} ${m.identificador} : ${m.mensaje} : ${m.informacionAdicional}`,
    ) ?? [],
  );
}
