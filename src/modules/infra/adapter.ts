import { AuthorizationVoucher, Order, ValidationVoucher } from '../domain/models';
import { Consumer, Producer } from 'kafkajs';
import { CorePort, MessageProducer, SealifyPort, SriPort } from '../domain/ports';

import { AuthorizationVoucherResponseDTO } from './data-transfer-object';
import { BaseHttpClient } from './http';
import { Endpoint } from '../domain/types';
import { Mapper } from './mappers';
import { OrderDTO } from '../app/dtos';
import { ProcessMessageUseCase } from '../app/usecase';
import { ReceiptVoucherResponseDTO } from './data-transfer-object';
import { SoapClient } from './soap';

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
          console.log(`📥 Kafka message from ${topic}: ${message.value.toString()}`);
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
    console.log(`📤 Message sent to ${this.topic}: ${JSON.stringify(message)}`);
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

export class SriAdapter implements SriPort {
  constructor(
    private validateClient: SoapClient,
    private authorizationClient: SoapClient,
    private validationMapper: Mapper<ReceiptVoucherResponseDTO, ValidationVoucher>,
    private authorizationMapper: Mapper<AuthorizationVoucherResponseDTO, AuthorizationVoucher>,
  ) {}
  async validateXml(xml: string): Promise<ValidationVoucher> {
    xml = Buffer.from(xml, 'utf-8').toString('base64');
    const response = await this.validateClient.callMethod('validarComprobante', { xml });
    return this.validationMapper.transform(
      response.RespuestaRecepcionComprobante as ReceiptVoucherResponseDTO,
    );
  }

  async authorizeXml(code: string): Promise<AuthorizationVoucher> {
    const response = await this.authorizationClient.callMethod('autorizacionComprobante', {
      claveAccesoComprobante: code,
    });
    return this.authorizationMapper.transform(
      response.RespuestaAutorizacionComprobante as AuthorizationVoucherResponseDTO,
    );
  }
}
