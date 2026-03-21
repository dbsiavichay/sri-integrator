import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Kafka, logLevel as KafkaLogLevel } from 'kafkajs';
import pino from 'pino';

import { AppConfig } from '#/config';
import { AuthorizeInvoiceCommand } from '#/modules/invoice/app/commands/authorize-invoice';
import { CreateInvoiceCommand } from '#/modules/invoice/app/commands/create-invoice';
import { SendInvoiceCommand } from '#/modules/invoice/app/commands/send-invoice';
import { SignInvoiceCommand } from '#/modules/invoice/app/commands/sign-invoice';
import { InvoiceMessageHandler } from '#/modules/invoice/app/handlers/invoice-message.handler';
import { OrderMessageHandler } from '#/modules/invoice/app/handlers/order-message.handler';
import { CoreAdapter } from '#/modules/invoice/infra/adapters/core.adapter';
import { SealifyAdapter } from '#/modules/invoice/infra/adapters/sealify.adapter';
import { SriAuthorizationAdapter } from '#/modules/invoice/infra/adapters/sri-authorization.adapter';
import { SriValidationAdapter } from '#/modules/invoice/infra/adapters/sri-validation.adapter';
import { InvoiceKafkaConsumer } from '#/modules/invoice/infra/messaging/kafka-consumer';
import { KafkaProducer } from '#/modules/invoice/infra/messaging/kafka-producer';
import {
  InvoiceMessageSchema,
  OrderMessageSchema,
  OrderResponseSchema,
  SealInvoiceResponseSchema,
} from '#/modules/invoice/infra/messaging/schemas';
import { KAFKA_TOPICS } from '#/modules/invoice/infra/messaging/topics';
import { DynamoInvoiceRepository } from '#/modules/invoice/infra/persistence/dynamo-invoice.repository';
import { SoapClient } from '#/shared/infra/soap-client';
import { logger } from '#/shared/logger';

export async function createContainer(config: AppConfig) {
  // Infra clients
  const kafkaLogLevelMap: Record<number, string> = {
    [KafkaLogLevel.ERROR]: 'error',
    [KafkaLogLevel.WARN]: 'warn',
    [KafkaLogLevel.INFO]: 'info',
    [KafkaLogLevel.DEBUG]: 'debug',
    [KafkaLogLevel.NOTHING]: 'silent',
  };

  const kafka = new Kafka({
    clientId: 'sri-integrator',
    brokers: config.kafka.brokers,
    logCreator:
      () =>
      ({ level, log }) => {
        const pinoLevel = (kafkaLogLevelMap[level] ?? 'info') as pino.Level;
        const { message, ...extra } = log;
        logger[pinoLevel]({ ...extra, kafka: true }, message);
      },
  });
  const consumer = kafka.consumer({ groupId: config.kafka.groupId });
  const producer = kafka.producer({
    idempotent: true,
    maxInFlightRequests: 5,
  });

  const ddbClient = new DynamoDBClient({ region: config.aws.region });
  const docClient = DynamoDBDocumentClient.from(ddbClient);

  const validationClient = new SoapClient(config.externalServices.sriVoucherWsdl);
  const authorizationClient = new SoapClient(config.externalServices.sriQueryWsdl);

  // Repositories
  const invoiceRepository = new DynamoInvoiceRepository(
    docClient,
    config.aws.dynamoDb.tables.invoices,
  );

  // Adapters
  const coreAdapter = new CoreAdapter(config.externalServices.core, OrderResponseSchema);
  const sealifyAdapter = new SealifyAdapter(
    config.externalServices.sealify,
    SealInvoiceResponseSchema,
  );
  const sriValidationAdapter = new SriValidationAdapter(validationClient);
  const sriAuthorizationAdapter = new SriAuthorizationAdapter(authorizationClient);

  // Producers
  const invoiceProducer = new KafkaProducer(producer, KAFKA_TOPICS.INVOICES);

  // Commands
  const createInvoiceCommand = new CreateInvoiceCommand(coreAdapter, invoiceRepository);
  const signInvoiceCommand = new SignInvoiceCommand(sealifyAdapter, invoiceRepository);
  const sendInvoiceCommand = new SendInvoiceCommand(sriValidationAdapter, invoiceRepository);
  const authorizeInvoiceCommand = new AuthorizeInvoiceCommand(
    sriAuthorizationAdapter,
    invoiceRepository,
  );

  // Handlers
  const orderMessageHandler = new OrderMessageHandler(createInvoiceCommand, invoiceProducer);
  const invoiceMessageHandler = new InvoiceMessageHandler(
    invoiceRepository,
    signInvoiceCommand,
    sendInvoiceCommand,
    authorizeInvoiceCommand,
    invoiceProducer,
  );

  // Consumer
  const kafkaConsumer = new InvoiceKafkaConsumer(
    consumer,
    [KAFKA_TOPICS.ORDERS, KAFKA_TOPICS.INVOICES],
    {
      [KAFKA_TOPICS.ORDERS]: {
        handler: orderMessageHandler,
        validator: OrderMessageSchema,
      },
      [KAFKA_TOPICS.INVOICES]: {
        handler: invoiceMessageHandler,
        validator: InvoiceMessageSchema,
      },
    },
  );

  await invoiceProducer.connect();

  return { consumer: kafkaConsumer, producer: invoiceProducer };
}
