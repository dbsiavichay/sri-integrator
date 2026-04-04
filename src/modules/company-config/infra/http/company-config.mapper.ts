import { CompanyConfig } from '../../domain/company-config';

export function toResponse(config: CompanyConfig) {
  return {
    taxId: config.taxId,
    name: config.name,
    tradeName: config.tradeName,
    mainAddress: config.mainAddress,
    branchAddress: config.branchAddress,
    branchCode: config.branchCode,
    salePointCode: config.salePointCode,
    specialTaxpayerResolution: config.specialTaxpayerResolution,
    withholdingAgentResolution: config.withholdingAgentResolution,
    accountingRequired: config.accountingRequired,
    environment: config.environment,
    emissionType: config.emissionType,
    invoiceSequence: config.invoiceSequence,
    updatedAt: config.updatedAt.toISOString(),
  };
}
