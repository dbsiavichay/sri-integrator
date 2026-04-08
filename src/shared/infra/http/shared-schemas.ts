export const metaSchema = {
  type: 'object',
  properties: {
    requestId: { type: 'string' },
    timestamp: { type: 'string', format: 'date-time' },
  },
  required: ['requestId', 'timestamp'],
} as const;

export const errorItemSchema = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['code', 'message'],
} as const;

export const errorResponseSchema = {
  type: 'object',
  properties: {
    errors: { type: 'array', items: errorItemSchema },
    meta: metaSchema,
  },
  required: ['errors', 'meta'],
} as const;

export function successSchema(dataSchema: object): object {
  return {
    type: 'object',
    properties: {
      data: dataSchema,
      meta: metaSchema,
    },
    required: ['data', 'meta'],
  };
}
