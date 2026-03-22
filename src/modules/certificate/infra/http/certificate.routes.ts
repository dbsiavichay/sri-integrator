import { FastifyInstance } from 'fastify';

import { logger } from '#/shared/logger';

import {
  DeleteCertificateCommand,
  GetCertificateCommand,
  ListCertificatesCommand,
  UploadCertificateCommand,
} from '../../app/certificate.commands';
import { Certificate } from '../../domain/certificate';

export interface CertificateCommands {
  upload: UploadCertificateCommand;
  get: GetCertificateCommand;
  list: ListCertificatesCommand;
  delete: DeleteCertificateCommand;
}

const certificateResponseProperties = {
  id: { type: 'string', format: 'uuid' },
  serialNumber: { type: 'string' },
  subject: { type: 'string' },
  issuer: { type: 'string' },
  validFrom: { type: 'string', format: 'date-time' },
  validTo: { type: 'string', format: 'date-time' },
  fileName: { type: 'string' },
  s3Url: { type: 'string', format: 'uri' },
  uploadedAt: { type: 'string', format: 'date-time' },
} as const;

function toResponse(cert: Certificate) {
  return {
    id: cert.id,
    serialNumber: cert.serialNumber,
    subject: cert.subject,
    issuer: cert.issuer,
    validFrom: cert.validFrom.toISOString(),
    validTo: cert.validTo.toISOString(),
    fileName: cert.fileName,
    s3Url: cert.s3Url,
    uploadedAt: cert.uploadedAt.toISOString(),
  };
}

export function registerCertificateRoutes(
  app: FastifyInstance,
  commands: CertificateCommands,
): void {
  // POST /api/certificates — upload .p12
  app.post(
    '/api/certificates',
    {
      schema: {
        tags: ['Certificates'],
        summary: 'Upload a .p12 digital signature certificate',
        multipartBody: {
          type: 'object',
          required: ['file', 'password'],
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'PKCS#12 (.p12) certificate file',
            },
            password: { type: 'string', description: 'Password for the .p12 file' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: certificateResponseProperties,
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          422: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      if (!data.filename.endsWith('.p12')) {
        return reply.status(400).send({ error: 'Only .p12 files are accepted' });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      const passwordField = data.fields['password'];
      const password =
        passwordField && 'value' in passwordField ? (passwordField.value as string) : '';

      try {
        const certificate = await commands.upload.execute({
          fileBuffer,
          fileName: data.filename,
          password,
        });

        logger.info({ certificateId: certificate.id }, 'Certificate uploaded');
        return reply.status(201).send(toResponse(certificate));
      } catch (error) {
        logger.error({ error }, 'Failed to upload certificate');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(422).send({ error: message });
      }
    },
  );

  // GET /api/certificates — list all
  app.get(
    '/api/certificates',
    {
      schema: {
        tags: ['Certificates'],
        summary: 'List all certificates',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: certificateResponseProperties,
            },
          },
        },
      },
    },
    async () => {
      const certificates = await commands.list.execute();
      return certificates.map(toResponse);
    },
  );

  // GET /api/certificates/:id — get by ID
  app.get<{ Params: { id: string } }>(
    '/api/certificates/:id',
    {
      schema: {
        tags: ['Certificates'],
        summary: 'Get a certificate by ID',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: certificateResponseProperties,
          },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const certificate = await commands.get.execute(request.params.id);
      if (!certificate) {
        return reply.status(404).send({ error: 'Certificate not found' });
      }
      return toResponse(certificate);
    },
  );

  // DELETE /api/certificates/:id — delete
  app.delete<{ Params: { id: string } }>(
    '/api/certificates/:id',
    {
      schema: {
        tags: ['Certificates'],
        summary: 'Delete a certificate',
        params: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid' } },
          required: ['id'],
        },
        response: {
          204: { type: 'null', description: 'Certificate deleted' },
          404: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      try {
        await commands.delete.execute(request.params.id);
        return reply.status(204).send();
      } catch (error) {
        logger.error({ error }, 'Failed to delete certificate');
        const message = error instanceof Error ? error.message : 'Unknown error';
        return reply.status(404).send({ error: message });
      }
    },
  );
}
