import { Invoice } from '../../domain/invoice';

export interface InvoiceCommand {
  execute(invoice: Invoice): Promise<void>;
}
