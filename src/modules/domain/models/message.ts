import { InvoiceStatus } from '../constants';

export class OrderEvent {
  constructor(
    public id: number,
    public accessCode: string,
    public sequence: string,
  ) {}
}

export class InvoiceMessage {
  constructor(
    public id: string,
    public orderId: string,
    public status: InvoiceStatus,
  ) {}
}
