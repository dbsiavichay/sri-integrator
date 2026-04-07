import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import scalarFastify from '@scalar/fastify-api-reference';
import Fastify, { FastifyInstance } from 'fastify';

import { logger } from '../logger';

export interface HttpServerConfig {
  port: number;
  host: string;
  serviceName: string;
  serviceVersion: string;
}

export async function createHttpServer(config: HttpServerConfig): Promise<FastifyInstance> {
  const app = Fastify({ loggerInstance: logger });

  await app.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
    attachFieldsToBody: false,
  });

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: config.serviceName,
        version: config.serviceVersion,
        description: 'Faclab Invoicing API',
      },
    },
    transform: ({ schema, url, ...rest }) => {
      const { multipartBody, ...schemaRest } = schema as Record<string, unknown>;
      const transformed = { ...schemaRest };
      if (multipartBody) {
        transformed.body = {
          content: {
            'multipart/form-data': {
              schema: multipartBody,
            },
          },
        };
      }
      return { schema: transformed, url, ...rest };
    },
  });

  await app.register(scalarFastify, { routePrefix: '/docs' });

  app.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { status: { type: 'string' } },
          },
        },
      },
    },
    async () => ({ status: 'ok' }),
  );

  return app as unknown as FastifyInstance;
}
