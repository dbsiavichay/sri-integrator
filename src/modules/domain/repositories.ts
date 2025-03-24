import { Invoice } from './models';

export interface InvoiceRepository {
  createInvoice(invoice: Invoice): Promise<Invoice>;
  updateInvoice(invoice: Invoice): Promise<Invoice>;
  getInvoiceById(id: string): Promise<Invoice | null>;
}
