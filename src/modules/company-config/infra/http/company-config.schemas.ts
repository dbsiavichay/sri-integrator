const companyConfigResponseProperties = {
  taxId: { type: 'string' },
  name: { type: 'string' },
  tradeName: { type: 'string' },
  mainAddress: { type: 'string' },
  branchAddress: { type: 'string' },
  branchCode: { type: 'string' },
  salePointCode: { type: 'string' },
  specialTaxpayerResolution: { type: ['string', 'null'] },
  withholdingAgentResolution: { type: ['string', 'null'] },
  accountingRequired: { type: 'boolean' },
  environment: { type: 'number' },
  emissionType: { type: 'number' },
  invoiceSequence: { type: 'number' },
  updatedAt: { type: 'string', format: 'date-time' },
} as const;

const errorResponse = {
  type: 'object',
  properties: { error: { type: 'string' } },
} as const;

export const saveCompanyConfigSchema = {
  tags: ['Company Config'],
  summary: 'Create or update the company fiscal configuration',
  body: {
    type: 'object',
    required: [
      'taxId',
      'name',
      'tradeName',
      'mainAddress',
      'branchAddress',
      'branchCode',
      'salePointCode',
      'environment',
      'emissionType',
    ],
    properties: {
      taxId: { type: 'string', minLength: 13, maxLength: 13 },
      name: { type: 'string', maxLength: 64 },
      tradeName: { type: 'string', maxLength: 64 },
      mainAddress: { type: 'string' },
      branchAddress: { type: 'string' },
      branchCode: { type: 'string', maxLength: 4 },
      salePointCode: { type: 'string', maxLength: 4 },
      specialTaxpayerResolution: { type: 'string', maxLength: 32 },
      withholdingAgentResolution: { type: 'string', maxLength: 32 },
      accountingRequired: { type: 'boolean' },
      environment: { type: 'number', enum: [1, 2] },
      emissionType: { type: 'number', enum: [1] },
      invoiceSequence: { type: 'number', minimum: 1 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: companyConfigResponseProperties,
    },
    400: errorResponse,
  },
} as const;

export const getCompanyConfigSchema = {
  tags: ['Company Config'],
  summary: 'Get the company fiscal configuration',
  response: {
    200: {
      type: 'object',
      properties: companyConfigResponseProperties,
    },
    404: errorResponse,
  },
} as const;
