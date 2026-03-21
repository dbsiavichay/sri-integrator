import { KafkaJS } from '@confluentinc/kafka-javascript';

import { logger } from '../logger';

export abstract class BaseKafkaConsumer {
  constructor(
    private consumer: KafkaJS.Consumer,
    private topics: string[],
  ) {}

  protected abstract handleMessage(topic: string, message: string): Promise<void>;

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: this.topics });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (message.value) {
          const value = message.value.toString();
          logger.debug(
            {
              topic,
              partition,
              offset: message.offset,
              key: message.key?.toString(),
              size: value.length,
            },
            'Kafka message received',
          );
          try {
            await this.handleMessage(topic, value);
          } catch (error) {
            logger.error(
              { topic, partition, offset: message.offset, error },
              'Failed to process message, skipping',
            );
          }
        }
      },
    });
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
