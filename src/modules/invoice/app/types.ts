export interface InvoiceMessageInput {
  type: string;
  invoiceId: string;
  saleId: string;
  status: string;
  occurredAt: Date;
}
