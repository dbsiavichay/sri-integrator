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
  private _status: InvoiceStatus;
  private _xml: string;

  constructor(
    public readonly id: string = uuidv4(),
    public readonly saleId: string,
    public readonly accessCode: AccessCode,
    status: InvoiceStatus,
    public readonly signatureId: string,
    xml: string,
    public readonly statusHistory: InvoiceStatusHistory[] = [],
  ) {
    this._status = status;
    this._xml = xml;
  }

  get status(): InvoiceStatus {
    return this._status;
  }

  get xml(): string {
    return this._xml;
  }

  static create(saleId: string, accessCode: AccessCode, signatureId: string, xml: string): Invoice {
    const invoice = new Invoice(
      undefined,
      saleId,
      accessCode,
      InvoiceStatus.CREATED,
      signatureId,
      xml,
    );
    invoice.addStatusHistory(InvoiceStatus.CREATED, new Date(), 'XML created');
    return invoice;
  }

  sign(signedXml: string): void {
    this.assertStatus(InvoiceStatus.CREATED, 'sign');
    this._xml = signedXml;
    this.addStatusHistory(InvoiceStatus.SIGNED, new Date(), 'XML signed');
  }

  markAsSent(messages: string[]): void {
    this.assertStatus(InvoiceStatus.SIGNED, 'send');
    this.addStatusHistory(InvoiceStatus.SENT, new Date(), messages.join(' >> '));
  }

  authorize(messages: string[]): void {
    this.assertStatus(InvoiceStatus.SENT, 'authorize');
    this.addStatusHistory(InvoiceStatus.AUTHORIZED, new Date(), messages.join(' >> '));
  }

  reject(messages: string[]): void {
    if ([InvoiceStatus.AUTHORIZED, InvoiceStatus.REJECTED].includes(this._status)) {
      throw new Error(`Cannot reject invoice in status ${this._status}`);
    }
    this.addStatusHistory(InvoiceStatus.REJECTED, new Date(), messages.join(' >> '));
  }

  pullEvents(): InvoiceDomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  private assertStatus(expected: InvoiceStatus, action: string): void {
    if (this._status !== expected) {
      throw new Error(`Cannot ${action} invoice in status ${this._status}`);
    }
  }

  private addStatusHistory(status: InvoiceStatus, date: Date, description?: string): void {
    this._status = status;
    this.statusHistory.push(new InvoiceStatusHistory(status, date, description));
    this._domainEvents.push({
      type: STATUS_EVENT_TYPE[status],
      invoiceId: this.id,
      saleId: this.saleId,
      status,
      occurredAt: date,
    } as InvoiceDomainEvent);
  }
}
