export interface InvoiceDTO {
  id: string;
  orderId: string;
  accessCode: string;
  status: string;
  signatureId: string;
  xml: string;
  statusHistory: {
    name: string;
    date: string;
    description?: string;
  }[];
  signedXml?: string | null;
  authorizedXml?: string | null;
}
