import { FastifyInstance } from 'fastify';

import { BadRequestError, NotFoundError } from '#/shared/errors/app-error';
import { logger } from '#/shared/logger';

import {
  GetCompanyConfigQuery,
  SaveCompanyConfigCommand,
  SaveCompanyConfigInput,
} from '../../app/company-config.commands';
import { toResponse } from './company-config.mapper';
import { getCompanyConfigSchema, saveCompanyConfigSchema } from './company-config.schemas';

export interface CompanyConfigHandlers {
  save: SaveCompanyConfigCommand;
  get: GetCompanyConfigQuery;
}

export function registerCompanyConfigRoutes(
  app: FastifyInstance,
  handlers: CompanyConfigHandlers,
): void {
  // PUT /api/company-config — create or update
  app.put('/api/company-config', { schema: saveCompanyConfigSchema }, async (request, reply) => {
    try {
      const config = await handlers.save.execute(request.body as SaveCompanyConfigInput);
      logger.info('Company config saved');
      return reply.success(toResponse(config));
    } catch (error) {
      logger.error({ error }, 'Failed to save company config');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestError(message);
    }
  });

  // GET /api/company-config — get current config
  app.get('/api/company-config', { schema: getCompanyConfigSchema }, async (_request, reply) => {
    const config = await handlers.get.execute();
    if (!config) {
      throw new NotFoundError('Company config not found');
    }
    return reply.success(toResponse(config));
  });
}
