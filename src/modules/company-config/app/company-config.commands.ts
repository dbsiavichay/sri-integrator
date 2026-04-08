import { CompanyConfig, EmissionType, Environment } from '../domain/company-config';
import { CompanyConfigRepository } from '../domain/repository';

export interface SaveCompanyConfigInput {
  taxId: string;
  name: string;
  tradeName: string;
  mainAddress: string;
  branchAddress: string;
  branchCode: string;
  salePointCode: string;
  specialTaxpayerResolution?: string | null;
  withholdingAgentResolution?: string | null;
  accountingRequired?: boolean;
  environment: Environment;
  emissionType: EmissionType;
  invoiceSequence?: number;
  signingCertId?: string | null;
}

export class SaveCompanyConfigCommand {
  constructor(private readonly repository: CompanyConfigRepository) {}

  async execute(input: SaveCompanyConfigInput): Promise<CompanyConfig> {
    let invoiceSequence = input.invoiceSequence;
    if (invoiceSequence === undefined) {
      const current = await this.repository.find();
      invoiceSequence = current?.invoiceSequence ?? 1;
    }
    const config = CompanyConfig.create({ ...input, invoiceSequence });
    return this.repository.save(config);
  }
}

export class GetCompanyConfigQuery {
  constructor(private readonly repository: CompanyConfigRepository) {}

  async execute(): Promise<CompanyConfig | null> {
    return this.repository.find();
  }
}
