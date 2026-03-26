import { Invoice } from '../../domain/invoice';
import { InvoiceRepository } from '../../domain/repository';

export class GetInvoiceQuery {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(id: string): Promise<Invoice | null> {
    return this.invoiceRepository.getInvoiceById(id);
  }
}

export class ListInvoicesQuery {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(): Promise<Invoice[]> {
    return this.invoiceRepository.findAll();
  }
}
