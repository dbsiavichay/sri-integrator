import 'fastify';

declare module 'fastify' {
  interface FastifyReply {
    success(data: unknown): FastifyReply;
  }
}
