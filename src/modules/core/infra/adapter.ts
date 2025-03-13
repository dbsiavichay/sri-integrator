import { HandleMessage } from '../app/usecase';
import { KafkaClient } from './kafka';

export class KafkaConsumer {
  constructor(
    private kafkaClient: KafkaClient,
    private handleMessage: HandleMessage,
    private topic: string,
  ) {}

  async start() {
    await this.kafkaClient.connect();

    await this.kafkaClient.subscribe(this.topic, async (message) => {
      await this.handleMessage.execute(message);
    });
  }
}
