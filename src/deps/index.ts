import { CoreAdapter, KafkaConsumer } from '#/modules/core/infra/adapter';
import { InvoiceMapper, OrderEventMapper } from '#/modules/core/infra/mappers';

import { GenerateVoucherXmlService } from '#/modules/core/domain/services';
import { HandleMessage } from '#/modules/core/app/usecase';
import { KAFKA_TOPICS } from './enums';
import { KafkaClient } from '#/modules/core/infra/kafka';
import loadConfig from '#/config';

export async function initKakfaConsumers() {
  const config = await loadConfig();

  const generateVoucherXmlService = new GenerateVoucherXmlService(config.timezone);

  const orderEventMapper = new OrderEventMapper();
  const invoiceMapper = new InvoiceMapper();

  const coreAdapter = new CoreAdapter(config.externalServices.core, invoiceMapper);

  const kafkaClient = new KafkaClient(config.kafka.brokers, config.kafka.groupId);
  const ordersHandleMessage = new HandleMessage(coreAdapter, generateVoucherXmlService);
  const ordersConsumer = new KafkaConsumer(
    kafkaClient,
    ordersHandleMessage,
    orderEventMapper,
    KAFKA_TOPICS.ORDERS,
  );

  return { kafkaClient, ordersHandleMessage, ordersConsumer };
}
