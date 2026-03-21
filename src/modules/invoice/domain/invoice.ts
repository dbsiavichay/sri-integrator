import { v4 as uuidv4 } from 'uuid';
import { AccessCode } from './access-code';
import { InvoiceDomainEvent, InvoiceStatus, STATUS_EVENT_TYPE } from './events';

export { InvoiceStatus } from './events';

export class InvoiceStatusHistory {
  constructor(
    public name: InvoiceStatus,
    public statusDate: Date,
    public description?: string,
  ) {}
}

export class Invoice {
  private _domainEvents: InvoiceDomainEvent[] = [];

  constructor(
    public id: string = uuidv4(),
    public orderId: string,
    public accessCode: AccessCode,
    public status: InvoiceStatus,
    public signatureId: string,
    public xml: string,
    public statusHistory: InvoiceStatusHistory[] = [],
  ) {}

  addStatusHistory(status: InvoiceStatus, date = new Date(), description?: string) {
    this.status = status;
    this.statusHistory.push(new InvoiceStatusHistory(status, date, description));
    this._domainEvents.push({
      type: STATUS_EVENT_TYPE[status],
      invoiceId: this.id,
      orderId: this.orderId,
      status,
      occurredAt: date,
    } as InvoiceDomainEvent);
  }

  pullEvents(): InvoiceDomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}
