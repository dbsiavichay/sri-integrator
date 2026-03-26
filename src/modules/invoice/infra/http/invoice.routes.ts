import { FastifyInstance } from 'fastify';

import { GetInvoiceQuery, ListInvoicesQuery } from '../../app/queries/invoice.queries';
import { toDetailResponse, toSummaryResponse } from './invoice.mapper';
import { getInvoiceSchema, listInvoicesSchema } from './invoice.schemas';

export interface InvoiceQueries {
  get: GetInvoiceQuery;
  list: ListInvoicesQuery;
}

export function registerInvoiceRoutes(app: FastifyInstance, queries: InvoiceQueries): void {
  // GET /api/invoices — list all
  app.get('/api/invoices', { schema: listInvoicesSchema }, async () => {
    const invoices = await queries.list.execute();
    return invoices.map(toSummaryResponse);
  });

  // GET /api/invoices/:id — get by ID
  app.get<{ Params: { id: string } }>(
    '/api/invoices/:id',
    { schema: getInvoiceSchema },
    async (request, reply) => {
      const invoice = await queries.get.execute(request.params.id);
      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }
      return toDetailResponse(invoice);
    },
  );
}
