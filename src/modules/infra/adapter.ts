import { Consumer, Producer } from 'kafkajs';
import { CorePort, MessageProducer, SealifyPort } from '../domain/ports';

import { BaseHttpClient } from './http';
import { Endpoint } from '../domain/types';
import { Mapper } from '../app/mappers';
import { Order } from '../domain/models';
import { OrderDTO } from '../app/dtos';
import { ProcessMessageUseCase } from '../app/usecase';

export abstract class BaseKafkaConsumer {
  constructor(
    private consumer: Consumer,
    private topics: string[],
  ) {}

  protected abstract handleMessage(topic: string, message: string): Promise<void>;

  async start(): Promise<void> {
    await this.consumer.connect();

    for (const topic of this.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: true });
    }

    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (message.value) {
          console.log(`📥 Kafka message from ${topic}: ${message.value}`);
          await this.handleMessage(topic, message.value.toString());
        }
      },
    });
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}

export class KafkaConsumer extends BaseKafkaConsumer {
  constructor(
    consumer: Consumer,
    topics: string[],
    private processors: Record<
      string,
      { usecase: ProcessMessageUseCase<any>; mapper: Mapper<any, any> }
    >,
  ) {
    super(consumer, topics);
  }

  protected async handleMessage(topic: string, message: string): Promise<void> {
    const processor = this.processors[topic];
    if (!processor) {
      console.warn(`⚠️ No processor defined for topic: ${topic}`);
      return;
    }

    const transformedMessage = processor.mapper.transform(JSON.parse(message));
    await processor.usecase.execute(transformedMessage);
  }
}

export class KafkaProducer<T> implements MessageProducer<T> {
  constructor(
    private producer: Producer,
    private topic: string,
  ) {}

  async sendMessage(message: T): Promise<void> {
    await this.producer.connect();
    await this.producer.send({
      topic: this.topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    console.log(`📤 Message sent to ${this.topic}: ${message}`);
    await this.producer.disconnect();
  }
}

export class CoreAdapter extends BaseHttpClient implements CorePort {
  constructor(
    endpoint: Endpoint,
    private mapper: Mapper<OrderDTO, Order>,
  ) {
    super({ baseURL: endpoint.host });
  }

  async retrieveOrder(orderId: number): Promise<Order> {
    const response = await this.get(`/api/invoice/${orderId}/`);
    const order = this.mapper.transform(response.data as OrderDTO);
    return order;
  }
}

export class SealifyAdapter extends BaseHttpClient implements SealifyPort {
  constructor(endpoint: Endpoint) {
    super({ baseURL: endpoint.host });
  }

  async sealInvoice(xml: string, certificateId: string): Promise<string> {
    const response = await this.post(`/api/certificates/${certificateId}/seal-invoice`, {
      invoiceXML: xml,
    });
    return response.data.sealedData as string;
  }
}
