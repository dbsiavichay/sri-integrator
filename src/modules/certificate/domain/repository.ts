import { Certificate } from './certificate';

export interface CertificateRepository {
  save(certificate: Certificate): Promise<Certificate>;
  findById(id: string): Promise<Certificate | null>;
  findAll(): Promise<Certificate[]>;
  findBySerialNumber(serialNumber: string): Promise<Certificate | null>;
  delete(id: string): Promise<void>;
}
