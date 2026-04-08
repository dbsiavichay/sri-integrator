import { FastifyInstance } from 'fastify';

import { NotFoundError } from '#/shared/errors/app-error';

import { GetInvoiceQuery, ListInvoicesQuery } from '../../app/queries/invoice.queries';
import { toDetailResponse, toSummaryResponse } from './invoice.mapper';
import { getInvoiceSchema, listInvoicesSchema } from './invoice.schemas';

export interface InvoiceQueries {
  get: GetInvoiceQuery;
  list: ListInvoicesQuery;
}

export function registerInvoiceRoutes(app: FastifyInstance, queries: InvoiceQueries): void {
  // GET /api/invoices — list all
  app.get('/api/invoices', { schema: listInvoicesSchema }, async (_request, reply) => {
    const invoices = await queries.list.execute();
    return reply.success(invoices.map(toSummaryResponse));
  });

  // GET /api/invoices/:id — get by ID
  app.get<{ Params: { id: string } }>(
    '/api/invoices/:id',
    { schema: getInvoiceSchema },
    async (request, reply) => {
      const invoice = await queries.get.execute(request.params.id);
      if (!invoice) {
        throw new NotFoundError('Invoice not found');
      }
      return reply.success(toDetailResponse(invoice));
    },
  );
}
