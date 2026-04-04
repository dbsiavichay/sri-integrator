import { z } from 'zod';

import { InvoiceStatus } from '../../domain/invoice';

// --- Order Response (from Core API) ---

const ProductSchema = z.object({
  id: z.number(),
  code: z.string(),
  sku: z.string(),
  name: z.string(),
  shortName: z.string(),
  description: z.string(),
  isInventoried: z.boolean(),
  applyIva: z.boolean(),
  applyIce: z.boolean(),
  stock: z.number(),
  warehouseLocation: z.string(),
  type: z.string(),
  taxes: z.array(z.number()),
});

const CustomerSchema = z.object({
  id: z.number(),
  code: z.string().max(16),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  bussinessName: z.string().max(128),
  address: z.string().nullable(),
  phone: z.string().max(16).nullable(),
  email: z.string().email(),
  codeType: z.string(),
});

const OrderLineSchema = z.object({
  id: z.number(),
  product: ProductSchema,
  quantity: z.number(),
  unitPrice: z.number(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
});

const PaymentSchema = z.object({
  id: z.number(),
  type: z.string(),
  amount: z.number(),
});

const ConfigSchema = z.object({
  companyCode: z.string(),
  companyName: z.string(),
  companyTradeName: z.string(),
  companyMainAddress: z.string(),
  companyBranchAddress: z.string(),
  companyBranchCode: z.string(),
  companySalePointCode: z.string(),
  specialTaxpayerResolution: z.string(),
  withholdingAgentResolution: z.string(),
  companyAccountingRequired: z.boolean(),
  environment: z.string(),
  emissionType: z.string(),
  signature: z.string(),
});

export const OrderResponseSchema = z.object({
  id: z.number(),
  lines: z.array(OrderLineSchema),
  payments: z.array(PaymentSchema),
  sriConfig: ConfigSchema,
  date: z.string(),
  authorizationDate: z.string().nullable(),
  voucherTypeCode: z.string(),
  accessCode: z.string(),
  companyBranchCode: z.string(),
  companySalePointCode: z.string(),
  sequence: z.string(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.coerce.number(),
  status: z.string(),
  file: z.any().nullable(),
  errors: z.record(z.any()),
  customer: CustomerSchema,
});

export type OrderResponse = z.infer<typeof OrderResponseSchema>;

// --- Kafka Message Schemas ---

export const OrderMessageSchema = z
  .object({
    id: z.number(),
    access_code: z.string(),
    sequence: z.string(),
  })
  .transform((data) => ({
    id: data.id,
    accessCode: data.access_code,
    sequence: data.sequence,
  }));

export type OrderMessage = z.infer<typeof OrderMessageSchema>;

export const InvoiceMessageSchema = z.object({
  type: z.string(),
  invoiceId: z.string(),
  orderId: z.string(),
  status: z.nativeEnum(InvoiceStatus),
  occurredAt: z.coerce.date(),
});

export type InvoiceMessage = z.infer<typeof InvoiceMessageSchema>;

const SaleConfirmedCustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  tax_id: z.string(),
  tax_type: z.enum(['RUC', 'NATIONAL_ID', 'PASSPORT', 'FOREIGN_ID']),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
});

const SaleConfirmedItemSchema = z.object({
  product_id: z.number(),
  sku: z.string(),
  product_name: z.string(),
  quantity: z.number(),
  unit_price: z.string(),
  discount: z.string(),
  tax_rate: z.string(),
  tax_amount: z.string(),
  subtotal: z.string(),
});

const SaleConfirmedPaymentSchema = z.object({
  method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'OTHER']),
  amount: z.string(),
});

const SaleConfirmedPayloadSchema = z.object({
  sale_id: z.number(),
  source: z.string(),
  subtotal: z.string(),
  total_discount: z.string(),
  total: z.string(),
  customer: SaleConfirmedCustomerSchema.nullable(),
  items: z.array(SaleConfirmedItemSchema),
  payments: z.array(SaleConfirmedPaymentSchema),
});

export const SaleConfirmedMessageSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.literal('SaleConfirmed'),
  aggregate_id: z.number(),
  occurred_at: z.string(),
  payload: SaleConfirmedPayloadSchema,
});

export type SaleConfirmedMessage = z.infer<typeof SaleConfirmedMessageSchema>;
