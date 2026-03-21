import {
  CoreAdapter,
  KafkaConsumer,
  KafkaProducer,
  SealifyAdapter,
  SriAuthorizationAdapter,
  SriValidationAdapter,
} from '#/modules/infra/adapters';
import {
  InvoiceMessageSchema,
  OrderMessageSchema,
  OrderResponseSchema,
  SealInvoiceResponseSchema,
} from '#/modules/infra/validators';
import { ProcessInvoiceMessage, ProcessOrderMessage } from '#/modules/app/usecase';

import { AppConfig } from '#/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoInvoiceRepository } from '#/modules/infra/repositories';
import { KAFKA_TOPICS } from './enums';
import { Kafka } from 'kafkajs';
import { SoapClient } from '#/shared/infra/soap-client';

export async function initKakfaConsumers(config: AppConfig) {
  // External services
  const kafka = new Kafka({
    clientId: 'sri-integrator',
    brokers: config.kafka.brokers,
  });
  const consumer = kafka.consumer({ groupId: config.kafka.groupId });
  const producer = kafka.producer();

  const ddbClient = new DynamoDBClient({ region: config.aws.region });
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  const validationClient = new SoapClient(config.externalServices.sriVoucherWsdl);
  const authorizationClient = new SoapClient(config.externalServices.sriQueryWsdl);

  // Adapters
  const coreAdapter = new CoreAdapter(config.externalServices.core, OrderResponseSchema);
  const sealifyAdapter = new SealifyAdapter(
    config.externalServices.sealify,
    SealInvoiceResponseSchema,
  );
  const sriValidationAdapter = new SriValidationAdapter(validationClient);
  const sriAuthorizationAdapter = new SriAuthorizationAdapter(authorizationClient);

  // Repositories
  const invoiceRepository = new DynamoInvoiceRepository(
    docClient,
    config.aws.dynamoDb.tables.invoices,
  );

  // Producers
  const invoiceProducer = new KafkaProducer(producer, KAFKA_TOPICS.INVOICES);

  // Use cases
  const processOrderMessage = new ProcessOrderMessage(
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
      usecase: processOrderMessage,
      validator: OrderMessageSchema,
    },
    invoices: {
      usecase: processInvoiceMessage,
      validator: InvoiceMessageSchema,
    },
  });

  return { kakfaConsumer };
}
