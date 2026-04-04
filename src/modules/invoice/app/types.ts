export interface InvoiceMessageInput {
  type: string;
  invoiceId: string;
  orderId: string;
  status: string;
  occurredAt: Date;
}
