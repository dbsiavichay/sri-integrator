export interface ProductDTO {
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
  taxes: number[];
}

export interface CustomerDTO {
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

export interface OrderLineDTO {
  id: number;
  product: ProductDTO;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface PaymentDTO {
  id: number;
  type: string;
  amount: number;
}

export interface ConfigDTO {
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

export interface OrderDTO {
  id: number;
  lines: OrderLineDTO[];
  payments: PaymentDTO[];
  sriConfig: ConfigDTO;
  date: string;
  authorizationDate: string | null;
  voucherTypeCode: string;
  accessCode: string;
  companyBranchCode: string;
  companySalePointCode: string;
  sequence: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  file: any | null;
  errors: Record<string, any>;
  customer: CustomerDTO;
}
