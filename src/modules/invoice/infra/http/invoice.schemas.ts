const statusHistorySchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    statusDate: { type: 'string', format: 'date-time' },
    description: { type: 'string' },
  },
} as const;

const invoiceSummaryProperties = {
  id: { type: 'string', format: 'uuid' },
  orderId: { type: 'string' },
  accessCode: { type: 'string' },
  status: { type: 'string' },
  signatureId: { type: 'string' },
  statusHistory: { type: 'array', items: statusHistorySchema },
} as const;

const invoiceDetailProperties = {
  ...invoiceSummaryProperties,
  xml: { type: 'string' },
} as const;

export const listInvoicesSchema = {
  tags: ['Invoices'],
  summary: 'List all invoices',
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: invoiceSummaryProperties,
      },
    },
  },
} as const;

export const getInvoiceSchema = {
  tags: ['Invoices'],
  summary: 'Get an invoice by ID',
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' } },
    required: ['id'],
  },
  response: {
    200: {
      type: 'object',
      properties: invoiceDetailProperties,
    },
    404: { type: 'object', properties: { error: { type: 'string' } } },
  },
} as const;
