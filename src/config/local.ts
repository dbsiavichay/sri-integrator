import { AppConfig } from './index';

export default {
  serviceName: 'sri-integrator',
  serviceVersion: '1.0.0',
  logger: {
    level: 'debug',
    prettyPrint: true,
  },
  externalServices: {
    otelCollector: {
      host: 'http://localhost:4318',
      timeout: 1000,
    },
    core: {
      host: 'http://localhost:8000',
      timeout: 1000,
    },
    sealify: {
      host: 'http://localhost:3000',
      timeout: 1000,
    },
    sriVoucherWsdl:
      'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl',
    sriQueryWsdl:
      'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl',
  },
  kafka: {
    brokers: ['localhost:29092'],
    groupId: 'sri-integrator',
  },
  aws: {
    region: 'us-east-1',
    dynamoDb: {
      tables: {
        invoices: 'invoices',
      },
    },
  },
  timezone: 'America/Guayaquil',
  environment: 'local',
} as AppConfig;
