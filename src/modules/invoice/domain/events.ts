export enum InvoiceStatus {
  CREATED = 'created',
  SIGNED = 'signed',
  SENT = 'sent',
  AUTHORIZED = 'authorized',
  REJECTED = 'rejected',
}

interface BaseInvoiceEvent {
  invoiceId: string;
  saleId: string;
  status: InvoiceStatus;
  occurredAt: Date;
}

export interface InvoiceCreated extends BaseInvoiceEvent {
  type: 'InvoiceCreated';
}

export interface InvoiceSigned extends BaseInvoiceEvent {
  type: 'InvoiceSigned';
}

export interface InvoiceSent extends BaseInvoiceEvent {
  type: 'InvoiceSent';
}

export interface InvoiceAuthorized extends BaseInvoiceEvent {
  type: 'InvoiceAuthorized';
}

export interface InvoiceRejected extends BaseInvoiceEvent {
  type: 'InvoiceRejected';
}

export type InvoiceDomainEvent =
  | InvoiceCreated
  | InvoiceSigned
  | InvoiceSent
  | InvoiceAuthorized
  | InvoiceRejected;

export const STATUS_EVENT_TYPE: Record<InvoiceStatus, InvoiceDomainEvent['type']> = {
  [InvoiceStatus.CREATED]: 'InvoiceCreated',
  [InvoiceStatus.SIGNED]: 'InvoiceSigned',
  [InvoiceStatus.SENT]: 'InvoiceSent',
  [InvoiceStatus.AUTHORIZED]: 'InvoiceAuthorized',
  [InvoiceStatus.REJECTED]: 'InvoiceRejected',
};
