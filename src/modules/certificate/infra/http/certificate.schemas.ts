const certificateResponseProperties = {
  id: { type: 'string', format: 'uuid' },
  serialNumber: { type: 'string' },
  subject: { type: 'string' },
  issuer: { type: 'string' },
  validFrom: { type: 'string', format: 'date-time' },
  validTo: { type: 'string', format: 'date-time' },
  fileName: { type: 'string' },
  s3Url: { type: 'string', format: 'uri' },
  uploadedAt: { type: 'string', format: 'date-time' },
} as const;

const errorResponse = {
  type: 'object',
  properties: { error: { type: 'string' } },
} as const;

export const uploadCertificateSchema = {
  tags: ['Certificates'],
  summary: 'Upload a .p12 digital signature certificate',
  multipartBody: {
    type: 'object',
    required: ['file', 'password'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'PKCS#12 (.p12) certificate file',
      },
      password: { type: 'string', description: 'Password for the .p12 file' },
    },
  },
  response: {
    201: {
      type: 'object',
      properties: certificateResponseProperties,
    },
    400: errorResponse,
    422: errorResponse,
  },
} as const;

export const listCertificatesSchema = {
  tags: ['Certificates'],
  summary: 'List all certificates',
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: certificateResponseProperties,
      },
    },
  },
} as const;

export const getCertificateSchema = {
  tags: ['Certificates'],
  summary: 'Get a certificate by ID',
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: certificateResponseProperties,
    },
    404: errorResponse,
  },
} as const;

export const deleteCertificateSchema = {
  tags: ['Certificates'],
  summary: 'Delete a certificate',
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    204: { type: 'null', description: 'Certificate deleted' },
    404: errorResponse,
  },
} as const;
