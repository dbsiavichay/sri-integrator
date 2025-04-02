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
  ) {}

  addStatusHistory(status: InvoiceStatus, date = new Date(), description?: string) {
    this.status = status;
    this.statusHistory.push(new InvoiceStatusHistory(status, date, description));
  }
}

export class InvoiceStatusHistory {
  constructor(
    public name: InvoiceStatus,
    public statusDate: Date,
    public description?: string,
  ) {}
}
