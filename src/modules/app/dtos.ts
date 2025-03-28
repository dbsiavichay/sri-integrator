interface Customer {
  id: number;
  code: string;
  firstName: string | null;
  lastName: string | null;
  bussinessName: string;
  address: string | null;
  phone: string | null;
  email: string;
  codeType: string;
}

interface Product {
  id: number;
  code: string;
  sku: string;
  name: string;
  shortName: string;
  description: string;
  isInventoried: boolean;
  applyIva: boolean;
  applyIce: boolean;
  stock: number;
  warehouseLocation: string;
  type: string;
  category: unknown | null;
  measure: unknown | null;
  provider: unknown | null;
  taxes: number[];
}

interface Line {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
}

interface Payment {
  id: number;
  type: string;
  amount: number;
}

interface SriConfig {
  companyCode: string;
  companyName: string;
  companyTradeName: string;
  companyMainAddress: string;
  companyBranchAddress: string;
  companyBranchCode: string;
  companySalePointCode: string;
  specialTaxpayerResolution: string;
  withholdingAgentResolution: string;
  companyAccountingRequired: boolean;
  environment: string;
  emissionType: string;
  signature: string;
}

interface Errors {
  [key: string]: unknown;
}

export interface OrderDTO {
  id: number;
  customer: Customer;
  lines: Line[];
  payments: Payment[];
  sriConfig: SriConfig;
  date: string;
  authorizationDate: string | null;
  voucherTypeCode: string;
  accessCode: string;
  companyBranchCode: string;
  companySalePointCode: string;
  sequence: string;
  subtotal: number;
  tax: number;
  total: string;
  status: string;
  file: unknown | null;
  errors: Errors;
}

export interface OrderEventDTO {
  id: number;
  access_code: string;
  sequence: string;
}

export interface InvoiceMessageDTO {
  id: number;
  orderId: number;
  status: string;
}
