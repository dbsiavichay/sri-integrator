import { CoreAdapter, KafkaConsumer, KafkaProducer, SealifyAdapter } from '#/modules/infra/adapter';
import { InvoiceMessageMapper, OrderEventMapper, OrderMapper } from '#/modules/infra/mappers';
import { ProcessInvoiceMessage, ProcessOrderEventMessage } from '#/modules/app/usecase';

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoInvoiceRepository } from '#/modules/infra/repositories';
import { GenerateVoucherXmlService } from '#/modules/domain/services';
import { KAFKA_TOPICS } from './enums';
import { Kafka } from 'kafkajs';
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

  // Domain services
  const generateVoucherXmlService = new GenerateVoucherXmlService(config.timezone);

  // Mappers
  const orderEventMapper = new OrderEventMapper();
  const orderMapper = new OrderMapper();
  const invoiceMessageMapper = new InvoiceMessageMapper();

  // Adapters
  const coreAdapter = new CoreAdapter(config.externalServices.core, orderMapper);
  const sealifyAdapter = new SealifyAdapter(config.externalServices.sealify);

  // Repositories
  const invoiceRepository = new DynamoInvoiceRepository(
    dddbClient,
    config.aws.dynamoDb.tables.invoices,
  );

  // Producers
  const invoiceProducer = new KafkaProducer(producer, KAFKA_TOPICS.INVOICES);

  // Use cases
  const processOrderEventMessage = new ProcessOrderEventMessage(
    generateVoucherXmlService,
    coreAdapter,
    invoiceRepository,
    invoiceProducer,
  );
  const processInvoiceMessage = new ProcessInvoiceMessage(sealifyAdapter, invoiceRepository);

  // Consumers
  const kakfaConsumer = new KafkaConsumer(consumer, [KAFKA_TOPICS.ORDERS, KAFKA_TOPICS.INVOICES], {
    orders: { usecase: processOrderEventMessage, mapper: orderEventMapper },
    invoices: { usecase: processInvoiceMessage, mapper: invoiceMessageMapper },
  });

  // Producers

  return { kakfaConsumer };
}
