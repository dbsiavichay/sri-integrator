import { AppConfig } from './index';

export default {
  externalServices: {
    core: {
      host: 'http://localhost:8000',
      timeout: 1000,
    },
  },
  kafka: {
    brokers: ['localhost:29092'],
    groupId: 'sri-integrator',
  },
  timezone: 'America/Guayaquil',
  environment: 'production',
} as AppConfig;
