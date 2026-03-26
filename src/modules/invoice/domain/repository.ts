import { Invoice } from './invoice';

export interface InvoiceRepository {
  createInvoice(invoice: Invoice): Promise<Invoice>;
  updateInvoice(invoice: Invoice): Promise<Invoice>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  findAll(): Promise<Invoice[]>;
}
