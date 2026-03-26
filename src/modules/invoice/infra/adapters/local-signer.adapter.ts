import { FileStoragePort } from '#/modules/certificate/domain/ports';
import { CertificateRepository } from '#/modules/certificate/domain/repository';

import { InvoiceSignerPort } from '../../domain/ports';
import { P12Reader, SigningCredentials } from '../signing/p12-reader';
import { XadesSigner } from '../signing/xades-signer';

export class LocalSignerAdapter implements InvoiceSignerPort {
  private credentials: SigningCredentials | null = null;

  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly fileStorage: FileStoragePort,
    private readonly xadesSigner: XadesSigner,
    private readonly p12Id: string,
    private readonly p12Password: string,
  ) {}

  async signInvoice(xml: string): Promise<string> {
    const credentials = await this.getCredentials();
    return this.xadesSigner.sign(xml, credentials);
  }

  private async getCredentials(): Promise<SigningCredentials> {
    if (this.credentials) return this.credentials;

    if (!this.p12Id) {
      throw new Error('SIGNING_P12_ID environment variable is not configured');
    }

    const certificate = await this.certificateRepository.findById(this.p12Id);
    if (!certificate) {
      throw new Error(`Signing certificate not found: ${this.p12Id}`);
    }

    const p12Buffer = await this.fileStorage.download(certificate.s3Key);
    const p12Reader = new P12Reader(p12Buffer, this.p12Password);
    this.credentials = p12Reader.getCredentials();

    return this.credentials;
  }
}
