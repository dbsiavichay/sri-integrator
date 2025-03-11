import { Consumer, Kafka } from "kafkajs";

import dotenv from "dotenv";

dotenv.config();

export class KafkaClient {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor() {
    this.kafka = new Kafka({
      clientId: "sri-integrator",
      brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
    });

    this.consumer = this.kafka.consumer({ groupId: "sri-integrator" });
  }

  async connect() {
    await this.consumer.connect();
  }

  async subscribe(topic: string, callback: (message: string) => Promise<void>) {
    await this.consumer.subscribe({ topic, fromBeginning: true });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        if (message.value) {
          const value = message.value.toString();
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
