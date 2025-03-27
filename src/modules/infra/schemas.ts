import { z } from 'zod';

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
  category: z.any().nullable(),
  measure: z.any().nullable(),
  provider: z.any().nullable(),
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

export const OrderSchema = z.object({
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

export const OrderEventSchema = z.object({
  id: z.number(),
  access_code: z.string(),
  sequence: z.string(),
});

export const InvoiceMessageSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  status: z.string(),
});
