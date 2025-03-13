import { AppConfig } from './index';

export default {
  externalServices: {
    service: {
      host: 'localhost',
      timeout: 1000,
    },
  },
  kafka: {
    brokers: ['localhost:29092'],
    groupId: 'sri-integrator',
  },
  environment: 'local',
} as AppConfig;
