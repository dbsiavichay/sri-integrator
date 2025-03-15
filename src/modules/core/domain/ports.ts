import { Invoice } from './models';

export interface CorePort {
  retrieveInvoice(invoiceId: number): Promise<Invoice>;
}
