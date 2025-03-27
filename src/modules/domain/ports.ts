import { Order } from './models';

export interface CorePort {
  retrieveOrder(orderId: number): Promise<Order>;
}

export interface SealifyPort {
  sealInvoice(xml: string, certificateId: string): Promise<string>;
}

export interface MessageProducer<T> {
  sendMessage(message: T): Promise<void>;
}
