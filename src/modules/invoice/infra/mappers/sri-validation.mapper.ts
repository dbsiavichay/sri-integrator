import { ValidationVoucher, ValidationVoucherStatus } from '../../domain/voucher';

interface MessageDTO {
  identificador: string;
  mensaje: string;
  informacionAdicional?: string;
  tipo: string;
}

interface VoucherDTO {
  claveAcceso: string;
  mensajes?: {
    mensaje: MessageDTO[];
  };
}

export interface ReceiptVoucherResponseDTO {
  estado: 'RECIBIDA' | 'DEVUELTA';
  comprobantes?: {
    comprobante: VoucherDTO[];
  };
}

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
