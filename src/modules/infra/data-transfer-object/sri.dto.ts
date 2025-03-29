export interface MessageDTO {
  identificador: string;
  mensaje: string;
  informacionAdicional?: string;
  tipo: string;
}

export interface VoucherDTO {
  claveAcceso: string;
  mensajes?: {
    mensaje: MessageDTO[];
  };
}
export interface AuthorizationDTO {
  estado: 'AUTORIZADO' | 'NO AUTORIZADO';
  fechaAutorizacion: string;
  ambiente: string;
  comprobante: string;
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

export interface AuthorizationVoucherResponseDTO {
  claveAccesoConsultada: string;
  numeroComprobantes: string;
  autorizaciones?: {
    autorizacion: AuthorizationDTO[];
  };
}
