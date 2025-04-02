import { z } from 'zod';

export const SealInvoiceResponseSchema = z.object({
  sealedData: z.string(),
});

export type SealInvoiceResponse = z.infer<typeof SealInvoiceResponseSchema>;
