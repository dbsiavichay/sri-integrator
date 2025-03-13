import { HandleMessage } from '#/modules/core/app/usecase';
import { KAFKA_TOPICS } from './enums';
import { KafkaClient } from '#/modules/core/infra/kafka';
import { KafkaConsumer } from '#/modules/core/infra/adapter';
import loadConfig from '#/config';

export async function initKakfaConsumers() {
  const config = await loadConfig();

  const kafkaClient = new KafkaClient(config.kafka.brokers, config.kafka.groupId);
  const ordersHandleMessage = new HandleMessage();
  const ordersConsumer = new KafkaConsumer(kafkaClient, ordersHandleMessage, KAFKA_TOPICS.ORDERS);

  return { kafkaClient, ordersHandleMessage, ordersConsumer };
}
