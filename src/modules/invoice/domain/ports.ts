import { Order } from './order';
import { AuthorizationVoucher, ValidationVoucher } from './voucher';

export interface CorePort {
  retrieveOrder(orderId: number): Promise<Order>;
}

export interface InvoiceSignerPort {
  signInvoice(xml: string): Promise<string>;
}

export interface MessageProducer<T> {
  sendMessage(message: T): Promise<void>;
}

export interface SriValidationPort {
  validateXml(xml: string): Promise<ValidationVoucher>;
}

export interface SriAuthorizationPort {
  authorizeXml(code: string): Promise<AuthorizationVoucher>;
}
