import { InvoiceStatus } from '#/modules/domain/constants';
import { InvoiceMessage, OrderMessage } from '#/modules/domain/models';
import { z } from 'zod';

export const OrderMessageSchema = z
  .object({
    id: z.number(),
    access_code: z.string(),
    sequence: z.string(),
  })
  .transform((dto) => new OrderMessage(dto.id, dto.access_code, dto.sequence));

export const InvoiceMessageSchema = z
  .object({
    id: z.string(),
    orderId: z.string(),
    status: z.nativeEnum(InvoiceStatus),
  })
  .transform((dto) => new InvoiceMessage(dto.id, dto.orderId, dto.status));
