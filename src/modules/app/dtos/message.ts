export interface OrderMessageDTO {
  id: number;
  access_code: string;
  sequence: string;
}

export interface InvoiceMessageDTO {
  id: string;
  orderId: string;
  status: string;
}
