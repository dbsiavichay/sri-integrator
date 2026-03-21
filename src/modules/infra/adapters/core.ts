import { AuthorizationVoucher, Order, ValidationVoucher } from '#/modules/domain/models';
import { AuthorizationVoucherResponseDTO, ReceiptVoucherResponseDTO } from '#/modules/app/dtos';
import { Consumer, Producer } from 'kafkajs';
import {
  CorePort,
  MessageProducer,
  SealifyPort,
  SriAuthorizationPort,
  SriValidationPort,
} from '#/modules/domain/ports';
import { OrderResponse, SealInvoiceResponse } from '../validators';

import { BaseHttpClient } from '../http';
import { BaseKafkaConsumer } from '../kafka';
import { Endpoint } from '#/modules/domain/types';
import { ProcessMessageUseCase } from '#/modules/app/usecase';
import { SoapClient } from '../soap';
import { ZodSchema } from 'zod';
import { mapOrderToDomain } from '#/modules/app/mappers/core';
import { mapValidationVoucherToDomain } from '#/modules/app/mappers/sri';
import { mapAuthorizationVoucherToDomain } from '#/modules/app/mappers/sri';

export class KafkaConsumer extends BaseKafkaConsumer {
  constructor(
    consumer: Consumer,
    topics: string[],
    private processors: Record<
      string,
      { usecase: ProcessMessageUseCase<any>; validator: ZodSchema<any> }
    >,
  ) {
    super(consumer, topics);
  }

  protected async handleMessage(topic: string, message: string): Promise<void> {
    const processor = this.processors[topic];
    if (!processor) {
      console.warn(`No processor defined for topic: ${topic}`);
      return;
    }

    const result = processor.validator.safeParse(JSON.parse(message));

    if (!result.success) {
      console.error(result.error.stack);
      throw new Error(result.error.errors.join(', '));
    }

    await processor.usecase.execute(result.data);
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
    console.log(`Message sent to ${this.topic}: ${JSON.stringify(message)}`);
    await this.producer.disconnect();
  }
}

export class CoreAdapter extends BaseHttpClient implements CorePort {
  constructor(
    endpoint: Endpoint,
    private validator: ZodSchema<OrderResponse>,
  ) {
    super({ baseURL: endpoint.host });
  }

  async retrieveOrder(orderId: number): Promise<Order> {
    const response = await this.get(`/api/invoice/${orderId}/`);
    const parsedResponse = this.validator.safeParse(response.data);
    if (parsedResponse.error) {
      console.log(`ERRORS: ${parsedResponse.error.stack}`);
      throw new Error(parsedResponse.error.errors.join(', '));
    }
    return mapOrderToDomain(parsedResponse.data);
  }
}

export class SealifyAdapter extends BaseHttpClient implements SealifyPort {
  constructor(
    endpoint: Endpoint,
    private validator: ZodSchema<SealInvoiceResponse>,
  ) {
    super({ baseURL: endpoint.host });
  }

  async sealInvoice(xml: string, certificateId: string): Promise<string> {
    const response = await this.post(`/api/certificates/${certificateId}/seal-invoice`, {
      invoiceXML: xml,
    });
    const parsedResponse = this.validator.safeParse(response.data);
    if (parsedResponse.error) {
      throw new Error(parsedResponse.error.errors.join(', '));
    }
    return parsedResponse.data.sealedData;
  }
}

export class SriValidationAdapter implements SriValidationPort {
  constructor(private validateClient: SoapClient) {}

  async validateXml(xml: string): Promise<ValidationVoucher> {
    xml = Buffer.from(xml, 'utf-8').toString('base64');
    const response = await this.validateClient.callMethod('validarComprobante', { xml });
    return mapValidationVoucherToDomain(
      response.RespuestaRecepcionComprobante as ReceiptVoucherResponseDTO,
    );
  }
}

export class SriAuthorizationAdapter implements SriAuthorizationPort {
  constructor(private authorizationClient: SoapClient) {}

  async authorizeXml(code: string): Promise<AuthorizationVoucher> {
    const response = await this.authorizationClient.callMethod('autorizacionComprobante', {
      claveAccesoComprobante: code,
    });
    return mapAuthorizationVoucherToDomain(
      response.RespuestaAutorizacionComprobante as AuthorizationVoucherResponseDTO,
    );
  }
}
