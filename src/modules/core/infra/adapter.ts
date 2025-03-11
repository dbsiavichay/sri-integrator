import { HandleMessage } from "../app/usecase";
import { KafkaClient } from "./kafka";

export class KafkaConsumer {
    private kafkaClient: KafkaClient;
    private handleMessage: HandleMessage;
  
    constructor() {
      this.kafkaClient = new KafkaClient();
      this.handleMessage = new HandleMessage();
    }
  
    async start() {
      await this.kafkaClient.connect();
  
      await this.kafkaClient.subscribe("orders", async (message) => {
        await this.handleMessage.execute(message);
      });
    }
  }