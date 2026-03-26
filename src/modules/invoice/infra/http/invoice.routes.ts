import { FastifyInstance } from 'fastify';

import { GetInvoiceQuery, ListInvoicesQuery } from '../../app/queries/invoice.queries';
import { Invoice } from '../../domain/invoice';

export interface InvoiceQueries {
  get: GetInvoiceQuery;
  list: ListInvoicesQuery;
}

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

function toSummaryResponse(invoice: Invoice) {
  return {
    id: invoice.id,
    orderId: invoice.orderId,
    accessCode: invoice.accessCode.value,
    status: invoice.status,
    signatureId: invoice.signatureId,
    statusHistory: invoice.statusHistory.map((h) => ({
      name: h.name,
      statusDate: h.statusDate.toISOString(),
      description: h.description ?? '',
    })),
  };
}

function toDetailResponse(invoice: Invoice) {
  return {
    ...toSummaryResponse(invoice),
    xml: invoice.xml,
  };
}

export function registerInvoiceRoutes(app: FastifyInstance, queries: InvoiceQueries): void {
  // GET /api/invoices — list all
  app.get(
    '/api/invoices',
    {
      schema: {
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
      },
    },
    async () => {
      const invoices = await queries.list.execute();
      return invoices.map(toSummaryResponse);
    },
  );

  // GET /api/invoices/:id — get by ID
  app.get<{ Params: { id: string } }>(
    '/api/invoices/:id',
    {
      schema: {
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
      },
    },
    async (request, reply) => {
      const invoice = await queries.get.execute(request.params.id);
      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }
      return toDetailResponse(invoice);
    },
  );
}
