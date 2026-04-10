import { KafkaJS } from '@confluentinc/kafka-javascript';
import { ZodSchema } from 'zod';

import { NonRetryableError } from '#/shared/errors/non-retryable.error';
import { DlqProducer } from '#/shared/infra/dlq-producer';
import { BaseKafkaConsumer, RetryConfig } from '#/shared/infra/kafka';
import { logger } from '#/shared/logger';

interface MessageProcessor {
  handle(message: unknown): Promise<void>;
}

export class InvoiceKafkaConsumer extends BaseKafkaConsumer {
  constructor(
    consumer: KafkaJS.Consumer,
    topics: string[],
    private processors: Record<string, { handler: MessageProcessor; validator: ZodSchema }>,
    dlqProducer: DlqProducer,
    retryConfig?: Partial<RetryConfig>,
  ) {
    super(consumer, topics, dlqProducer, retryConfig);
  }

  protected async handleMessage(topic: string, message: string): Promise<void> {
    const processor = this.processors[topic];
    if (!processor) {
      throw new NonRetryableError(`No processor defined for topic: ${topic}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(message);
    } catch {
      throw new NonRetryableError(`Invalid JSON in message from topic: ${topic}`);
    }

    const result = processor.validator.safeParse(parsed);

    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new NonRetryableError(`Invalid message schema on topic ${topic}: ${issues}`);
    }

    logger.debug({ topic }, 'Message validated, dispatching to handler');
    await processor.handler.handle(result.data);
  }
}
