import { Consumer } from 'kafkajs';
import { logger } from '#/shared/logger';
import { BaseKafkaConsumer } from '#/shared/infra/kafka';
import { ZodSchema } from 'zod';

interface MessageProcessor {
  handle(message: any): Promise<void>;
}

export class InvoiceKafkaConsumer extends BaseKafkaConsumer {
  constructor(
    consumer: Consumer,
    topics: string[],
    private processors: Record<string, { handler: MessageProcessor; validator: ZodSchema<any> }>,
  ) {
    super(consumer, topics);
  }

  protected async handleMessage(topic: string, message: string): Promise<void> {
    const processor = this.processors[topic];
    if (!processor) {
      logger.warn({ topic }, 'No processor defined for topic');
      return;
    }

    const result = processor.validator.safeParse(JSON.parse(message));

    if (!result.success) {
      logger.error({ error: result.error.stack }, 'Invalid message schema');
      throw new Error(result.error.errors.join(', '));
    }

    await processor.handler.handle(result.data);
  }
}
