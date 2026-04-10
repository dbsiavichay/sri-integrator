import { KafkaJS } from '@confluentinc/kafka-javascript';

import { logger } from '../logger';

interface DlqEnvelope {
  originalTopic: string;
  originalPartition: number;
  originalOffset: string;
  originalKey: string | null;
  originalValue: string;
  originalTimestamp: string | null;
  errorMessage: string;
  errorType: 'NON_RETRYABLE' | 'MAX_RETRIES_EXHAUSTED';
  retriesAttempted: number;
  consumerGroupId: string;
  failedAt: string;
}

export interface DlqMessageContext {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: string;
  timestamp: string | null;
}

export class DlqProducer {
  constructor(
    private producer: KafkaJS.Producer,
    private dlqTopic: string,
    private consumerGroupId: string,
  ) {}

  async send(
    context: DlqMessageContext,
    error: Error,
    errorType: 'NON_RETRYABLE' | 'MAX_RETRIES_EXHAUSTED',
    retriesAttempted: number,
  ): Promise<void> {
    const envelope: DlqEnvelope = {
      originalTopic: context.topic,
      originalPartition: context.partition,
      originalOffset: context.offset,
      originalKey: context.key,
      originalValue: context.value,
      originalTimestamp: context.timestamp,
      errorMessage: error.message,
      errorType,
      retriesAttempted,
      consumerGroupId: this.consumerGroupId,
      failedAt: new Date().toISOString(),
    };

    const key = `${context.topic}:${context.partition}:${context.offset}`;

    await this.producer.send({
      topic: this.dlqTopic,
      messages: [{ key, value: JSON.stringify(envelope) }],
    });

    logger.warn(
      {
        dlqTopic: this.dlqTopic,
        originalTopic: context.topic,
        originalOffset: context.offset,
        errorType,
        errorMessage: error.message,
      },
      'Message sent to DLQ',
    );
  }
}
