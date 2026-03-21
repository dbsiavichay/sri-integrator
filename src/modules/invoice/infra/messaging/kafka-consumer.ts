import { Consumer } from 'kafkajs';
import { ZodSchema } from 'zod';

import { BaseKafkaConsumer } from '#/shared/infra/kafka';
import { logger } from '#/shared/logger';

interface MessageProcessor {
  handle(message: unknown): Promise<void>;
}

export class InvoiceKafkaConsumer extends BaseKafkaConsumer {
  constructor(
    consumer: Consumer,
    topics: string[],
    private processors: Record<string, { handler: MessageProcessor; validator: ZodSchema }>,
  ) {
    super(consumer, topics);
  }

  protected async handleMessage(topic: string, message: string): Promise<void> {
    const processor = this.processors[topic];
    if (!processor) {
      logger.warn({ topic }, 'No processor defined for topic');
      return;
    }

    const parsed = JSON.parse(message);
    const result = processor.validator.safeParse(parsed);

    if (!result.success) {
      logger.error({ topic, issues: result.error.issues }, 'Invalid message schema, skipping');
      return;
    }

    await processor.handler.handle(result.data);
  }
}
