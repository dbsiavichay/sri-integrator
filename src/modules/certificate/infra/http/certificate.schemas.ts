const certificateResponseProperties = {
  id: {
    type: 'string',
    format: 'uuid',
    description: 'Unique certificate identifier. Use this value as SIGNING_P12_ID.',
  },
  serialNumber: {
    type: 'string',
    description: 'Serial number extracted from the X.509 certificate inside the .p12 file.',
  },
  subject: {
    type: 'string',
    description: 'Distinguished Name (DN) of the certificate subject in RFC 4514 format.',
    example: 'CN=JUAN PEREZ, O=BCE, C=EC',
  },
  issuer: {
    type: 'string',
    description:
      'Distinguished Name (DN) of the Certificate Authority that issued this certificate.',
    example: 'CN=BCE ENTIDAD CERTIFICADORA, O=BCE, C=EC',
  },
  validFrom: {
    type: 'string',
    format: 'date-time',
    description: 'Certificate validity start date (ISO 8601).',
  },
  validTo: {
    type: 'string',
    format: 'date-time',
    description: 'Certificate expiry date (ISO 8601). Invoices cannot be signed after this date.',
  },
  fileName: {
    type: 'string',
    description: 'Original filename of the uploaded .p12 file.',
    example: 'firma_electronica.p12',
  },
  s3Url: {
    type: 'string',
    format: 'uri',
    description: 'S3 URL where the certificate file is stored.',
  },
  uploadedAt: {
    type: 'string',
    format: 'date-time',
    description: 'Timestamp when the certificate was uploaded (ISO 8601).',
  },
} as const;

const errorResponse = {
  type: 'object',
  properties: { error: { type: 'string' } },
} as const;

export const uploadCertificateSchema = {
  tags: ['Certificates'],
  summary: 'Upload a .p12 digital signature certificate',
  description:
    'Accepts a PKCS#12 (.p12) file and its password. The service parses the certificate metadata, stores the file in S3, and persists the metadata in DynamoDB. The returned `id` should be set as the `SIGNING_P12_ID` environment variable so the service uses this certificate to sign invoices.',
  multipartBody: {
    type: 'object',
    required: ['file', 'password'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description:
          'PKCS#12 (.p12) certificate file issued by a trusted CA (e.g. BCE, Security Data, ANF).',
      },
      password: {
        type: 'string',
        description: 'Password that protects the .p12 file. Required to extract the private key.',
      },
    },
  },
  response: {
    201: {
      type: 'object',
      description: 'Certificate uploaded and parsed successfully.',
      properties: certificateResponseProperties,
    },
    400: {
      ...errorResponse,
      description: 'Missing file, wrong file extension, or invalid request.',
    },
    422: {
      ...errorResponse,
      description: 'File could not be parsed — wrong password or corrupted .p12.',
    },
  },
} as const;

export const listCertificatesSchema = {
  tags: ['Certificates'],
  summary: 'List all certificates',
  description: 'Returns all certificates stored in the system.',
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
  description: 'Returns the metadata for a single certificate.',
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid', description: 'Certificate UUID.' } },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: certificateResponseProperties,
    },
    404: { ...errorResponse, description: 'No certificate found with the given ID.' },
  },
} as const;

export const deleteCertificateSchema = {
  tags: ['Certificates'],
  summary: 'Delete a certificate',
  description:
    'Deletes the certificate from both DynamoDB and S3. If the certificate is currently configured as SIGNING_P12_ID, invoice signing will fail until a new certificate is configured.',
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid', description: 'Certificate UUID.' } },
    required: ['id'],
  },
  response: {
    204: { type: 'null', description: 'Certificate deleted successfully.' },
    404: { ...errorResponse, description: 'No certificate found with the given ID.' },
  },
} as const;
