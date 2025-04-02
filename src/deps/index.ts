import 'reflect-metadata';
import '../modules/app/mappers/core';
import '../modules/app/mappers/sri';
import '../modules/app/mappers/invoice';
import '../modules/app/mappers/message';

import { AuthorizationVoucherMapper, ValidationVoucherMapper } from '../modules/app/mappers/sri';
import {
  CoreAdapter,
  KafkaConsumer,
  KafkaProducer,
  SealifyAdapter,
  SriAuthorizationAdapter,
  SriValidationAdapter,
} from '#/modules/infra/adapter';
import { InvoiceMessageMapper, OrderMessageMapper } from '../modules/app/mappers/message';
import {
  InvoiceMessageSchema,
  OrderMessageSchema,
  OrderResponseSchema,
  SealInvoiceResponseSchema,
} from '#/modules/infra/validators';
import { ProcessInvoiceMessage, ProcessOrderMessage } from '#/modules/app/usecase';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoInvoiceRepository } from '#/modules/infra/repositories';
import { InvoiceMapper } from '../modules/app/mappers/invoice';
import { KAFKA_TOPICS } from './enums';
import { Kafka } from 'kafkajs';
import { MapperFactory } from '#/modules/app/mappers/factory';
import { OrderMapper } from '#/modules/app/mappers/core';
import { SoapClient } from '#/modules/infra/soap';
import loadConfig from '#/config';

export async function initKakfaConsumers() {
  const config = await loadConfig();

  // External services
  const kafka = new Kafka({
    clientId: 'sri-integrator',
    brokers: config.kafka.brokers,
  });
  const consumer = kafka.consumer({ groupId: config.kafka.groupId });
  const producer = kafka.producer();

  const ddbClient = new DynamoDBClient({ region: config.aws.region });
  const dddbClient = DynamoDBDocumentClient.from(ddbClient);

  const validationClient = new SoapClient(config.externalServices.sriVoucherWsdl);
  const authorizationClient = new SoapClient(config.externalServices.sriQueryWsdl);

  // Asegurarse que el MapperFactory se inicialice después de que los decoradores se hayan ejecutado
  const mapperFactory = MapperFactory.getInstance();

  // Obtener el mapper después de que todo esté registrado
  const orderMessageMapper = mapperFactory.get<OrderMessageMapper>('orderMessage');
  const invoiceMessageMapper = mapperFactory.get<InvoiceMessageMapper>('invoiceMessage');
  const orderMapper = mapperFactory.get<OrderMapper>('order');
  const validationVoucherMapper = mapperFactory.get<ValidationVoucherMapper>('validationVoucher');
  const authorizationVoucherMapper =
    mapperFactory.get<AuthorizationVoucherMapper>('authorizationVoucher');
  const invoiceMapper = mapperFactory.get<InvoiceMapper>('invoice');

  // Adapters
  const coreAdapter = new CoreAdapter(
    config.externalServices.core,
    OrderResponseSchema,
    orderMapper,
  );
  const sealifyAdapter = new SealifyAdapter(
    config.externalServices.sealify,
    SealInvoiceResponseSchema,
  );
  const sriValidationAdapter = new SriValidationAdapter(validationClient, validationVoucherMapper);

  const sriAuthorizationAdapter = new SriAuthorizationAdapter(
    authorizationClient,
    authorizationVoucherMapper,
  );

  // Repositories
  const invoiceRepository = new DynamoInvoiceRepository(
    dddbClient,
    config.aws.dynamoDb.tables.invoices,
    invoiceMapper,
  );

  // Producers
  const invoiceProducer = new KafkaProducer(producer, KAFKA_TOPICS.INVOICES);

  // Use cases
  const processOrderEventMessage = new ProcessOrderMessage(
    coreAdapter,
    invoiceRepository,
    invoiceProducer,
  );
  const processInvoiceMessage = new ProcessInvoiceMessage(
    sealifyAdapter,
    sriValidationAdapter,
    sriAuthorizationAdapter,
    invoiceRepository,
    invoiceProducer,
  );

  // Consumers
  const kakfaConsumer = new KafkaConsumer(consumer, [KAFKA_TOPICS.ORDERS, KAFKA_TOPICS.INVOICES], {
    orders: {
      usecase: processOrderEventMessage,
      validator: OrderMessageSchema,
      mapper: orderMessageMapper,
    },
    invoices: {
      usecase: processInvoiceMessage,
      validator: InvoiceMessageSchema,
      mapper: invoiceMessageMapper,
    },
  });

  // Producers

  return { kakfaConsumer };
}
