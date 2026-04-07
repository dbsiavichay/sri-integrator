import { FileStoragePort } from '#/modules/certificate/domain/ports';
import { CertificateRepository } from '#/modules/certificate/domain/repository';
import { CompanyConfigRepository } from '#/modules/company-config/domain/repository';

import { InvoiceSignerPort } from '../../domain/ports';
import { P12Reader, SigningCredentials } from '../signing/p12-reader';
import { XadesSigner } from '../signing/xades-signer';

export class SignerAdapter implements InvoiceSignerPort {
  private credentials: SigningCredentials | null = null;
  private cachedP12Id: string | null = null;

  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly fileStorage: FileStoragePort,
    private readonly xadesSigner: XadesSigner,
    private readonly companyConfigRepository: CompanyConfigRepository,
    private readonly p12Password: string,
  ) {}

  async signInvoice(xml: string): Promise<string> {
    const credentials = await this.getCredentials();
    return this.xadesSigner.sign(xml, credentials);
  }

  private async getCredentials(): Promise<SigningCredentials> {
    const companyConfig = await this.companyConfigRepository.find();
    if (!companyConfig) throw new Error('Company config not found');

    const { signingCertId } = companyConfig;
    if (!signingCertId) throw new Error('No signing certificate configured in company config');

    if (this.credentials && this.cachedP12Id === signingCertId) return this.credentials;

    const certificate = await this.certificateRepository.findById(signingCertId);
    if (!certificate) throw new Error(`Signing certificate not found: ${signingCertId}`);

    const p12Buffer = await this.fileStorage.download(certificate.s3Key);
    const p12Reader = new P12Reader(p12Buffer, this.p12Password);
    this.credentials = p12Reader.getCredentials();
    this.cachedP12Id = signingCertId;

    return this.credentials;
  }
}
