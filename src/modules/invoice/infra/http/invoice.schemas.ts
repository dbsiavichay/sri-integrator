import { errorResponseSchema, successSchema } from '#/shared/infra/http/shared-schemas';

const statusHistorySchema = {
  type: 'object',
  description: 'A single status transition recorded on the invoice audit trail.',
  properties: {
    name: {
      type: 'string',
      description: 'Status name at the time of the transition.',
      example: 'SIGNED',
    },
    statusDate: {
      type: 'string',
      format: 'date-time',
      description: 'ISO 8601 timestamp when the transition occurred.',
    },
    description: {
      type: 'string',
      description: 'Optional message from SRI or internal notes attached to the transition.',
    },
  },
} as const;

const invoiceSummaryProperties = {
  id: { type: 'string', format: 'uuid', description: 'Unique invoice identifier.' },
  orderId: { type: 'string', description: 'Identifier of the originating sale order.' },
  accessCode: {
    type: 'string',
    description:
      '49-digit SRI access code that uniquely identifies the voucher. Includes emission date, voucher type, RUC, environment, sequence, and a mod-11 check digit.',
    example: '2412202401179214100100120010010000000011234567811',
  },
  status: {
    type: 'string',
    description: 'Current lifecycle status of the invoice.',
    enum: ['CREATED', 'SIGNED', 'SENT', 'AUTHORIZED', 'REJECTED'],
    example: 'AUTHORIZED',
  },
  signatureId: {
    type: 'string',
    format: 'uuid',
    description: 'ID of the digital certificate used to sign the invoice XML.',
  },
  statusHistory: {
    type: 'array',
    description: 'Ordered list of all status transitions the invoice has gone through.',
    items: statusHistorySchema,
  },
} as const;

const invoiceDetailProperties = {
  ...invoiceSummaryProperties,
  xml: {
    type: 'string',
    description: 'Full signed invoice XML in SRI format. Present only in the detail endpoint.',
  },
} as const;

const invoiceSummaryObjectSchema = {
  type: 'object',
  properties: invoiceSummaryProperties,
} as const;

const invoiceDetailObjectSchema = {
  type: 'object',
  properties: invoiceDetailProperties,
} as const;

export const listInvoicesSchema = {
  tags: ['Invoices'],
  summary: 'List all invoices',
  description:
    'Returns a summary list of all invoices stored in the system, ordered by creation time. The XML body is omitted from list responses for performance.',
  response: {
    200: successSchema({ type: 'array', items: invoiceSummaryObjectSchema }),
  },
} as const;

export const getInvoiceSchema = {
  tags: ['Invoices'],
  summary: 'Get an invoice by ID',
  description: 'Returns full invoice detail including the signed XML and complete status history.',
  params: {
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid', description: 'Invoice UUID.' } },
    required: ['id'],
  },
  response: {
    200: successSchema(invoiceDetailObjectSchema),
    404: { ...errorResponseSchema, description: 'No invoice found with the given ID.' },
  },
} as const;
