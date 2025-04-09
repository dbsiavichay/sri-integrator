import {
  initKakfaConsumers,
  initTelemetry,
  shutdownTelemetry,
  initLogger,
  getLogger,
} from './deps';

import loadConfig from './config';

const main = async () => {
  const config = await loadConfig();
  const logger = initLogger(config);
  await initTelemetry(config);
  const { kakfaConsumer } = await initKakfaConsumers(config);
  await kakfaConsumer.start();

  const shutdown = async () => {
    logger.info('Cerrando aplicación...');
    //await kakfaConsumer.stop();
    await shutdownTelemetry();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

main().catch(async (error) => {
  const logger = getLogger();
  logger.error('Error en la aplicación', {
    error: error instanceof Error ? error.message : String(error),
  });
  await shutdownTelemetry();
  process.exit(1);
});
