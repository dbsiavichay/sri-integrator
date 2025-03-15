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

  async subscribe(topic: string, callback: (message: object) => Promise<void>) {
    await this.consumer.subscribe({ topic, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (message.value) {
          const value = JSON.parse(message.value.toString());
          console.log(`Kafka Message: ${value}`);
          await callback(value);
        }
      },
    });
  }

  async disconnect() {
    await this.consumer.disconnect();
  }
}
