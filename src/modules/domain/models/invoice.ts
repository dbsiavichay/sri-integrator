import { InvoiceStatus } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export class Invoice {
  constructor(
    public id: string = uuidv4(),
    public orderId: string,
    public accessCode: string,
    public status: InvoiceStatus,
    public signatureId: string,
    public xml: string,
    public statusHistory: InvoiceStatusHistory[] = [],
    public signedXml?: string | null,
    public authorizedXml?: string | null,
  ) {}

  addStatusHistory(status: InvoiceStatus, date = new Date(), description?: string) {
    this.statusHistory.push(new InvoiceStatusHistory(status, date, description));
  }
}

export class InvoiceStatusHistory {
  constructor(
    public name: InvoiceStatus,
    public date: Date,
    public description?: string,
  ) {}
}
