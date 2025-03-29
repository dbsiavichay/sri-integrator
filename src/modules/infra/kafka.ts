import { Consumer } from 'kafkajs';

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
          console.log(`📥 Kafka message from ${topic}: ${message.value.toString()}`);
          await this.handleMessage(topic, message.value.toString());
        }
      },
    });
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}
