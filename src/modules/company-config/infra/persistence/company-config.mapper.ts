import { CompanyConfig, EmissionType, Environment } from '../../domain/company-config';

export interface CompanyConfigRecord {
  id: string;
  tax_id: string;
  name: string;
  trade_name: string;
  main_address: string;
  branch_address: string;
  branch_code: string;
  sale_point_code: string;
  special_taxpayer_resolution: string | null;
  withholding_agent_resolution: string | null;
  accounting_required: boolean;
  environment: number;
  emission_type: number;
  invoice_sequence: number;
  signing_cert_id: string | null;
  updated_at: string;
}

export function toCompanyConfigRecord(config: CompanyConfig): CompanyConfigRecord {
  return {
    id: config.id,
    tax_id: config.taxId,
    name: config.name,
    trade_name: config.tradeName,
    main_address: config.mainAddress,
    branch_address: config.branchAddress,
    branch_code: config.branchCode,
    sale_point_code: config.salePointCode,
    special_taxpayer_resolution: config.specialTaxpayerResolution,
    withholding_agent_resolution: config.withholdingAgentResolution,
    accounting_required: config.accountingRequired,
    environment: config.environment,
    emission_type: config.emissionType,
    invoice_sequence: config.invoiceSequence,
    signing_cert_id: config.signingCertId,
    updated_at: config.updatedAt.toISOString(),
  };
}

export function fromCompanyConfigRecord(record: CompanyConfigRecord): CompanyConfig {
  return new CompanyConfig(
    record.id,
    record.tax_id,
    record.name,
    record.trade_name,
    record.main_address,
    record.branch_address,
    record.branch_code,
    record.sale_point_code,
    record.special_taxpayer_resolution,
    record.withholding_agent_resolution,
    record.accounting_required,
    record.environment as Environment,
    record.emission_type as EmissionType,
    record.invoice_sequence ?? 1,
    record.signing_cert_id ?? null,
    new Date(record.updated_at),
  );
}
