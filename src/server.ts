import { KafkaConsumer } from "./modules/core/infra/adapter";

const main = async () => {
    const consumer = new KafkaConsumer();
    await consumer.start();
  };
  
main().catch(console.error);