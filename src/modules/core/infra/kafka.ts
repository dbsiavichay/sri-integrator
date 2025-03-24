import { Consumer, Kafka } from 'kafkajs';

export class KafkaClient {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(brokers: string[], groupId: string) {
    this.kafka = new Kafka({
      clientId: 'sri-integrator',
      brokers,
    });

    this.consumer = this.kafka.consumer({ groupId });
  }

  async connect() {
    await this.consumer.connect();
  }

  async subscribe(topic: string, callback: (message: string) => Promise<void>) {
    await this.consumer.subscribe({ topic, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (message.value) {
          console.log(`Kafka Message: ${message.value}`);
          await callback(message.value);
        }
      },
    });
  }

  async disconnect() {
    await this.consumer.disconnect();
  }
}
