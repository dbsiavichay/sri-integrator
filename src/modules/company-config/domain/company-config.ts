export enum Environment {
  TESTING = 1,
  PRODUCTION = 2,
}

export enum EmissionType {
  NORMAL = 1,
}

export class CompanyConfig {
  static readonly SINGLETON_ID = 'default';

  constructor(
    public readonly id: string,
    public readonly taxId: string,
    public readonly name: string,
    public readonly tradeName: string,
    public readonly mainAddress: string,
    public readonly branchAddress: string,
    public readonly branchCode: string,
    public readonly salePointCode: string,
    public readonly specialTaxpayerResolution: string | null,
    public readonly withholdingAgentResolution: string | null,
    public readonly accountingRequired: boolean,
    public readonly environment: Environment,
    public readonly emissionType: EmissionType,
    public readonly updatedAt: Date,
  ) {}

  static create(props: {
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
  }): CompanyConfig {
    return new CompanyConfig(
      CompanyConfig.SINGLETON_ID,
      props.taxId,
      props.name,
      props.tradeName,
      props.mainAddress,
      props.branchAddress,
      props.branchCode,
      props.salePointCode,
      props.specialTaxpayerResolution ?? null,
      props.withholdingAgentResolution ?? null,
      props.accountingRequired ?? false,
      props.environment,
      props.emissionType,
      new Date(),
    );
  }
}
