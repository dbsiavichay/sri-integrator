import { AppConfig } from './index';

export default {
  externalServices: {
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
  environment: 'production',
} as AppConfig;
