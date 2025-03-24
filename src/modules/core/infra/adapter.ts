import { Invoice, OrderEvent } from '../domain/models';
import { InvoiceDTO, OrderEventDTO } from '../app/dtos';

import { BaseHttpClient } from './http';
import { Endpoint } from '../domain/types';
import { HandleMessage } from '../app/usecase';
import { KafkaClient } from './kafka';
import { Mapper } from '../app/mappers';

export class KafkaConsumer {
  constructor(
    private kafkaClient: KafkaClient,
    private handleMessage: HandleMessage,
    private mapper: Mapper<OrderEventDTO, OrderEvent>,
    private topic: string,
  ) {}

  async start() {
    await this.kafkaClient.connect();

    await this.kafkaClient.subscribe(this.topic, async (message: string) => {
      const data = JSON.parse(message) as OrderEventDTO;
      const orderEvent = this.mapper.transform(data);
      await this.handleMessage.execute(orderEvent);
    });
  }
}

export class CoreAdapter extends BaseHttpClient {
  constructor(
    endpoint: Endpoint,
    private mapper: Mapper<InvoiceDTO, Invoice>,
  ) {
    super({ baseURL: endpoint.host });
  }

  async retrieveInvoice(invoiceId: number): Promise<Invoice> {
    const request = await this.get(`/api/invoice/${invoiceId}/`);
    const invoice = this.mapper.transform(request.data as InvoiceDTO);
    return invoice;
  }
}
