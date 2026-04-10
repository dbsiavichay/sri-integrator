import { KafkaJS } from '@confluentinc/kafka-javascript';

import { BadRequestError, ValidationError } from '../errors/app-error';
import { NonRetryableError } from '../errors/non-retryable.error';
import { logger } from '../logger';
import { DlqMessageContext, DlqProducer } from './dlq-producer';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = { maxRetries: 3, baseDelayMs: 1000 };

function isRetryable(error: unknown): boolean {
  if (error instanceof NonRetryableError) return false;
  if (error instanceof BadRequestError) return false;
  if (error instanceof ValidationError) return false;
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(attempt: number, baseDelayMs: number): number {
  const delay = baseDelayMs * Math.pow(2, attempt);
  const jitter = 0.75 + Math.random() * 0.5;
  return delay * jitter;
}

export abstract class BaseKafkaConsumer {
  private retryConfig: RetryConfig;

  constructor(
    private consumer: KafkaJS.Consumer,
    private topics: string[],
    private dlqProducer: DlqProducer,
    retryConfig?: Partial<RetryConfig>,
  ) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  protected abstract handleMessage(topic: string, message: string): Promise<void>;

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: this.topics });

    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!message.value) return;

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

        const dlqContext: DlqMessageContext = {
          topic,
          partition,
          offset: message.offset,
          key: message.key?.toString() ?? null,
          value,
          timestamp: message.timestamp ?? null,
        };

        await this.processWithRetry(topic, value, dlqContext);

        await this.consumer.commitOffsets([
          { topic, partition, offset: (BigInt(message.offset) + 1n).toString() },
        ]);
      },
    });
  }

  private async processWithRetry(
    topic: string,
    value: string,
    dlqContext: DlqMessageContext,
  ): Promise<void> {
    const { maxRetries, baseDelayMs } = this.retryConfig;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.handleMessage(topic, value);
        return;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (!isRetryable(error)) {
          logger.error(
            { topic, offset: dlqContext.offset, err, attempt },
            'Non-retryable error, sending to DLQ',
          );
          await this.dlqProducer.send(dlqContext, err, 'NON_RETRYABLE', attempt);
          return;
        }

        if (attempt < maxRetries) {
          const backoff = calculateBackoff(attempt, baseDelayMs);
          logger.warn(
            { topic, offset: dlqContext.offset, err, attempt: attempt + 1, maxRetries, backoff },
            'Retryable error, retrying after backoff',
          );
          await sleep(backoff);
        } else {
          logger.error(
            { topic, offset: dlqContext.offset, err, retriesAttempted: maxRetries },
            'Max retries exhausted, sending to DLQ',
          );
          await this.dlqProducer.send(dlqContext, err, 'MAX_RETRIES_EXHAUSTED', maxRetries);
        }
      }
    }
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
