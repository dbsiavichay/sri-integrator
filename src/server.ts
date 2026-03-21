import { createContainer } from './container';
import { initLogger, logger } from '#/shared/logger';
import loadConfig from './config';

const main = async () => {
  const config = await loadConfig();
  initLogger({
    level: config.logger.level,
    serviceName: config.serviceName,
    environment: config.environment,
  });

  const { consumer, producer } = await createContainer(config);
  await consumer.start();

  const shutdown = async () => {
    logger.info('Shutting down...');
    try {
      await consumer.stop();
      await producer.disconnect();
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
    }
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

main().catch((error) => {
  logger.error(
    { error: error instanceof Error ? error.message : String(error) },
    'Application error',
  );
  process.exit(1);
});
