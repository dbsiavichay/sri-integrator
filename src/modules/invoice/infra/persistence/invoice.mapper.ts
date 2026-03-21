import { AccessCode } from '../../domain/access-code';
import { Invoice, InvoiceStatus, InvoiceStatusHistory } from '../../domain/invoice';

export interface InvoiceRecord {
  id: string;
  orderId: string;
  accessCode: string;
  status: string;
  signatureId: string;
  xml: string;
  statusHistory: {
    name: string;
    statusDate: string;
    description?: string;
  }[];
}

export function toInvoiceRecord(invoice: Invoice): InvoiceRecord {
  return {
    id: invoice.id,
    orderId: invoice.orderId,
    accessCode: invoice.accessCode.value,
    status: invoice.status,
    signatureId: invoice.signatureId,
    xml: invoice.xml,
    statusHistory: invoice.statusHistory.map((h) => ({
      name: h.name,
      statusDate: h.statusDate.toISOString(),
      description: h.description ?? '',
    })),
  };
}

export function fromInvoiceRecord(record: InvoiceRecord): Invoice {
  return new Invoice(
    record.id,
    record.orderId,
    AccessCode.create(record.accessCode),
    record.status as InvoiceStatus,
    record.signatureId,
    record.xml,
    record.statusHistory.map(
      (h) =>
        new InvoiceStatusHistory(h.name as InvoiceStatus, new Date(h.statusDate), h.description),
    ),
  );
}
