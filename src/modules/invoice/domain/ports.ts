import { AuthorizationVoucher, ValidationVoucher } from './voucher';
import { Order } from './order';

export interface CorePort {
  retrieveOrder(orderId: number): Promise<Order>;
}

export interface SealifyPort {
  sealInvoice(xml: string, certificateId: string): Promise<string>;
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
