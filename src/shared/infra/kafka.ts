import { Consumer } from 'kafkajs';

import { logger } from '../logger';

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
          logger.info({ topic, message: message.value.toString() }, 'Kafka message received');
          await this.handleMessage(topic, message.value.toString());
        }
      },
    });
  }

  async stop(): Promise<void> {
    await this.consumer.stop();
    await this.consumer.disconnect();
  }
}
