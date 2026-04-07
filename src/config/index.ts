export interface AppConfig {
  serviceName: string;
  serviceVersion: string;
  logger: {
    level: string;
  };
  http: {
    port: number;
    host: string;
  };
  externalServices: {
    sriVoucherWsdl: string;
    sriQueryWsdl: string;
  };
  signing: {
    p12Password: string;
  };
  kafka: {
    brokers: string[];
    groupId: string;
  };
  aws: {
    region: string;
    endpoint?: string;
    dynamoDb: {
      tables: {
        invoices: string;
        certificates: string;
        companyConfig: string;
      };
    };
    s3: {
      bucket: string;
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
