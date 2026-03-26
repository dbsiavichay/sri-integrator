import { CompanyConfig } from './company-config';

export interface CompanyConfigRepository {
  save(config: CompanyConfig): Promise<CompanyConfig>;
  find(): Promise<CompanyConfig | null>;
}
