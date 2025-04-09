import { Endpoint } from '#/modules/domain/types';

export interface AppConfig {
  serviceName: string;
  serviceVersion: string;
  logger: {
    level: string;
    prettyPrint: boolean;
  };
  externalServices: {
    otelCollector: Endpoint;
    core: Endpoint;
    sealify: Endpoint;
    sriVoucherWsdl: string;
    sriQueryWsdl: string;
  };
  kafka: {
    brokers: string[];
    groupId: string;
  };
  aws: {
    region: string;
    dynamoDb: {
      tables: {
        invoices: string;
      };
    };
  };
  timezone: string;
  environment: string;
}

const env = process.env.NODE_ENV || 'local';
async function loadConfig(): Promise<AppConfig> {
  const configModule = await import(`./${env.toLowerCase()}`);
  return configModule.default as AppConfig;
}

export default loadConfig;
