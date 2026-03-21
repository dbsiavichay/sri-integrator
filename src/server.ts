import { initKakfaConsumers } from './deps';
import { initLogger, logger } from '#/shared/logger';

import loadConfig from './config';

const main = async () => {
  const config = await loadConfig();
  initLogger({
    level: config.logger.level,
    serviceName: config.serviceName,
    environment: config.environment,
  });
  const { kakfaConsumer } = await initKakfaConsumers(config);
  await kakfaConsumer.start();

  const shutdown = async () => {
    logger.info('Shutting down...');
    //await kakfaConsumer.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

main().catch(async (error) => {
  logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    'Application error',
  );
  process.exit(1);
});
