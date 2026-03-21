import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { KafkaJS } from '@confluentinc/kafka-javascript';

import { AppConfig } from '#/config';
import { AuthorizeInvoiceCommand } from '#/modules/invoice/app/commands/authorize-invoice';
import { InvoiceCommand } from '#/modules/invoice/app/commands/command';
import { CreateInvoiceCommand } from '#/modules/invoice/app/commands/create-invoice';
import { SendInvoiceCommand } from '#/modules/invoice/app/commands/send-invoice';
import { SignInvoiceCommand } from '#/modules/invoice/app/commands/sign-invoice';
import { InvoiceMessageHandler } from '#/modules/invoice/app/handlers/invoice-message.handler';
import { OrderMessageHandler } from '#/modules/invoice/app/handlers/order-message.handler';
import { InvoiceStatus } from '#/modules/invoice/domain/invoice';
import { CoreAdapter } from '#/modules/invoice/infra/adapters/core.adapter';
import { LocalSignerAdapter } from '#/modules/invoice/infra/adapters/local-signer.adapter';
import { SriAuthorizationAdapter } from '#/modules/invoice/infra/adapters/sri-authorization.adapter';
import { SriValidationAdapter } from '#/modules/invoice/infra/adapters/sri-validation.adapter';
import { InvoiceKafkaConsumer } from '#/modules/invoice/infra/messaging/kafka-consumer';
import { KafkaProducer } from '#/modules/invoice/infra/messaging/kafka-producer';
import {
  InvoiceMessageSchema,
  OrderMessageSchema,
  OrderResponseSchema,
} from '#/modules/invoice/infra/messaging/schemas';
import { KAFKA_TOPICS } from '#/modules/invoice/infra/messaging/topics';
import { DynamoInvoiceRepository } from '#/modules/invoice/infra/persistence/dynamo-invoice.repository';
import { P12Reader } from '#/modules/invoice/infra/signing/p12-reader';
import { XadesSigner } from '#/modules/invoice/infra/signing/xades-signer';
import { SoapClient } from '#/shared/infra/soap-client';

export async function createContainer(config: AppConfig) {
  // Infra clients
  const kafka = new KafkaJS.Kafka({
    kafkaJS: {
      brokers: config.kafka.brokers,
      clientId: 'sri-integrator',
      logLevel: KafkaJS.logLevel.INFO,
    },
  });
  const consumer = kafka.consumer({
    kafkaJS: {
      groupId: config.kafka.groupId,
    },
  });
  const producer = kafka.producer({
    kafkaJS: {
      acks: -1,
    },
    'enable.idempotence': true,
    'max.in.flight.requests.per.connection': 5,
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
  const p12Reader = new P12Reader(config.signing.p12Path, config.signing.p12Password);
  const xadesSigner = new XadesSigner(config.timezone);
  const localSignerAdapter = new LocalSignerAdapter(p12Reader, xadesSigner);
  const sriValidationAdapter = new SriValidationAdapter(validationClient);
  const sriAuthorizationAdapter = new SriAuthorizationAdapter(authorizationClient);

  // Producers
  const invoiceProducer = new KafkaProducer(producer, KAFKA_TOPICS.INVOICES);

  // Commands
  const createInvoiceCommand = new CreateInvoiceCommand(coreAdapter, invoiceRepository);
  const signInvoiceCommand = new SignInvoiceCommand(localSignerAdapter, invoiceRepository);
  const sendInvoiceCommand = new SendInvoiceCommand(sriValidationAdapter, invoiceRepository);
  const authorizeInvoiceCommand = new AuthorizeInvoiceCommand(
    sriAuthorizationAdapter,
    invoiceRepository,
  );

  // Command dispatch map
  const commandMap = new Map<InvoiceStatus, InvoiceCommand>([
    [InvoiceStatus.CREATED, signInvoiceCommand],
    [InvoiceStatus.SIGNED, sendInvoiceCommand],
    [InvoiceStatus.SENT, authorizeInvoiceCommand],
  ]);

  // Handlers
  const orderMessageHandler = new OrderMessageHandler(createInvoiceCommand, invoiceProducer);
  const invoiceMessageHandler = new InvoiceMessageHandler(
    invoiceRepository,
    commandMap,
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
