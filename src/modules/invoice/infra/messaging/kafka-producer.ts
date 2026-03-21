import { KafkaJS } from '@confluentinc/kafka-javascript';

import { logger } from '#/shared/logger';

import { MessageProducer } from '../../domain/ports';

export class KafkaProducer<T> implements MessageProducer<T> {
  constructor(
    private producer: KafkaJS.Producer,
    private topic: string,
  ) {}

  async connect(): Promise<void> {
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
  }

  async sendMessage(message: T): Promise<void> {
    await this.producer.send({
      topic: this.topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    logger.debug({ topic: this.topic }, 'Message sent');
  }
}
