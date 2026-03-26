import { AppConfig } from './index';

export default {
  serviceName: 'sri-integrator',
  serviceVersion: '1.0.0',
  logger: {
    level: 'debug',
  },
  http: {
    port: 3000,
    host: '0.0.0.0',
  },
  externalServices: {
    core: {
      host: 'http://localhost:8000',
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
    endpoint: 'http://localhost:4566',
    dynamoDb: {
      tables: {
        invoices: 'invoices',
        certificates: 'certificates',
        companyConfig: 'company_config',
      },
    },
    s3: {
      bucket: 'sri-integrator-certificates',
    },
  },
  signing: {
    p12Id: process.env.SIGNING_P12_ID || '',
    p12Password: process.env.SIGNING_P12_PASSWORD || '',
  },
  timezone: 'America/Guayaquil',
  environment: 'local',
} as AppConfig;
