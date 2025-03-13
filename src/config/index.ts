import { Endpoint } from '#/modules/core/domain/types';

export interface AppConfig {
  externalServices: {
    service: Endpoint;
  };
  kafka: {
    brokers: string[];
    groupId: string;
  };
  environment: string;
}

const env = process.env.NODE_ENV || 'local';
async function loadConfig(): Promise<AppConfig> {
  const configModule = await import(`./${env.toLowerCase()}`);
  return configModule.default as AppConfig;
}

export default loadConfig;
