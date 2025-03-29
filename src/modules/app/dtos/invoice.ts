export interface InvoiceDTO {
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
