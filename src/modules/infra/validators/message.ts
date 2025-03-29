import { InvoiceMessageDTO, OrderMessageDTO } from '#/modules/app/dtos';
import { InvoiceStatus } from '#/modules/domain/constants';
import { z } from 'zod';

export const OrderMessageSchema = z.object({
  id: z.number(),
  access_code: z.string(),
  sequence: z.string(),
}) satisfies z.ZodType<OrderMessageDTO>;

export const InvoiceMessageSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: z.nativeEnum(InvoiceStatus),
}) satisfies z.ZodType<InvoiceMessageDTO>;
