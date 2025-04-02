import { GenerateInvoiceXml } from '../services';

export class Product {
  constructor(
    public id: number,
    public code: string,
    public sku: string,
    public name: string,
    public shortName: string,
    public description: string,
    public isInventoried: boolean,
    public applyIva: boolean,
    public applyIce: boolean,
    public stock: number,
    public warehouseLocation: string,
    public type: string,
    public taxes: number[],
  ) {}
}

export class Customer {
  constructor(
    public id: number,
    public code: string,
    public firstName: string | null,
    public lastName: string | null,
    public bussinessName: string,
    public address: string | null,
    public phone: string | null,
    public email: string,
    public codeType: string,
  ) {}
}

export class Line {
  constructor(
    public id: number,
    public product: Product,
    public quantity: number,
    public unitPrice: number,
    public subtotal: number,
    public tax: number,
    public total: number,
  ) {}
}

export class Payment {
  constructor(
    public id: number,
    public type: string,
    public amount: number,
  ) {}
}

export class SriConfig {
  constructor(
    public companyCode: string,
    public companyName: string,
    public companyTradeName: string,
    public companyMainAddress: string,
    public companyBranchAddress: string,
    public companyBranchCode: string,
    public companySalePointCode: string,
    public specialTaxpayerResolution: string,
    public withholdingAgentResolution: string,
    public companyAccountingRequired: boolean,
    public environment: string,
    public emissionType: string,
    public signature: string,
  ) {}
}

export class Order {
  constructor(
    public id: number,
    public lines: Line[],
    public payments: Payment[],
    public sriConfig: SriConfig,
    public date: Date,
    public authorizationDate: Date | null,
    public voucherTypeCode: string,
    public accessCode: string,
    public companyBranchCode: string,
    public companySalePointCode: string,
    public sequence: string,
    public subtotal: number,
    public tax: number,
    public total: number,
    public status: string,
    public file: any | null,
    public errors: Record<string, any>,
    public customer: Customer,
  ) {}

  public generateInvoiceXml(): string {
    return GenerateInvoiceXml.generate(this);
  }
}
