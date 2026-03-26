import { FastifyInstance } from 'fastify';

import { logger } from '#/shared/logger';

import {
  GetCompanyConfigQuery,
  SaveCompanyConfigCommand,
  SaveCompanyConfigInput,
} from '../../app/company-config.commands';
import { CompanyConfig } from '../../domain/company-config';

export interface CompanyConfigHandlers {
  save: SaveCompanyConfigCommand;
  get: GetCompanyConfigQuery;
}

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
  updatedAt: { type: 'string', format: 'date-time' },
} as const;

function toResponse(config: CompanyConfig) {
  return {
    taxId: config.taxId,
    name: config.name,
    tradeName: config.tradeName,
    mainAddress: config.mainAddress,
    branchAddress: config.branchAddress,
    branchCode: config.branchCode,
    salePointCode: config.salePointCode,
    specialTaxpayerResolution: config.specialTaxpayerResolution,
    withholdingAgentResolution: config.withholdingAgentResolution,
    accountingRequired: config.accountingRequired,
    environment: config.environment,
    emissionType: config.emissionType,
    updatedAt: config.updatedAt.toISOString(),
  };
}

export function registerCompanyConfigRoutes(
  app: FastifyInstance,
  handlers: CompanyConfigHandlers,
): void {
  // PUT /api/company-config — create or update
  app.put(
    '/api/company-config',
    {
      schema: {
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
          },
        },
        response: {
          200: {
            type: 'object',
            properties: companyConfigResponseProperties,
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      try {
        const config = await handlers.save.execute(request.body as SaveCompanyConfigInput);
        logger.info('Company config saved');
        return reply.status(200).send(toResponse(config));
      } catch (error) {
        logger.error({ error }, 'Failed to save company config');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(400).send({ error: message });
      }
    },
  );

  // GET /api/company-config — get current config
  app.get(
    '/api/company-config',
    {
      schema: {
        tags: ['Company Config'],
        summary: 'Get the company fiscal configuration',
        response: {
          200: {
            type: 'object',
            properties: companyConfigResponseProperties,
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (_request, reply) => {
      const config = await handlers.get.execute();
      if (!config) {
        return reply.status(404).send({ error: 'Company config not found' });
      }
      return toResponse(config);
    },
  );
}
