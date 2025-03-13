import { initKakfaConsumers } from './deps';
const main = async () => {
  const { ordersConsumer } = await initKakfaConsumers();
  await ordersConsumer.start();
};

main().catch(console.error);
