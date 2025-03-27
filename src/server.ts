import { initKakfaConsumers } from './deps';
const main = async () => {
  const { kakfaConsumer } = await initKakfaConsumers();
  await kakfaConsumer.start();
};

main().catch(console.error);
