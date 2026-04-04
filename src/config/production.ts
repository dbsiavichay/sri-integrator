import { AppConfig } from './index';

export default {
  serviceName: 'sri-integrator',
  serviceVersion: '1.0.0',
  logger: {
    level: 'info',
  },
  http: {
    port: Number(process.env.HTTP_PORT) || 3173,
    host: '0.0.0.0',
  },
  externalServices: {
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
        certificates: 'certificates',
        companyConfig: 'company_config',
      },
    },
    s3: {
      bucket: process.env.S3_CERTIFICATES_BUCKET || 'sri-integrator-certificates',
    },
  },
  signing: {
    p12Id: process.env.SIGNING_P12_ID!,
    p12Password: process.env.SIGNING_P12_PASSWORD!,
  },
  timezone: 'America/Guayaquil',
  environment: 'production',
} as AppConfig;
