export interface CreateInvoiceInput {
  id: number;
  accessCode: string;
  sequence: string;
}

export interface InvoiceMessageInput {
  type: string;
  invoiceId: string;
  orderId: string;
  status: string;
  occurredAt: Date;
}
