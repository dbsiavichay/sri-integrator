import { NotFoundError } from '#/shared/errors/app-error';

import { Certificate } from '../domain/certificate';
import { FileStoragePort, P12ParserPort } from '../domain/ports';
import { CertificateRepository } from '../domain/repository';

export interface UploadCertificateInput {
  fileBuffer: Buffer;
  fileName: string;
  password: string;
}

export class UploadCertificateCommand {
  constructor(
    private readonly p12Parser: P12ParserPort,
    private readonly fileStorage: FileStoragePort,
    private readonly certificateRepository: CertificateRepository,
  ) {}

  async execute(input: UploadCertificateInput): Promise<Certificate> {
    const metadata = this.p12Parser.parse(input.fileBuffer, input.password);
    const s3Key = `certificates/${metadata.serialNumber}/${input.fileName}`;
    const s3Url = await this.fileStorage.upload(s3Key, input.fileBuffer, 'application/x-pkcs12');

    const certificate = Certificate.create({
      serialNumber: metadata.serialNumber,
      subject: metadata.subject,
      issuer: metadata.issuer,
      validFrom: metadata.validFrom,
      validTo: metadata.validTo,
      fileName: input.fileName,
      s3Key,
      s3Url,
    });

    await this.certificateRepository.save(certificate);
    return certificate;
  }
}

export class GetCertificateCommand {
  constructor(private readonly certificateRepository: CertificateRepository) {}

  async execute(id: string): Promise<Certificate | null> {
    return this.certificateRepository.findById(id);
  }
}

export class ListCertificatesCommand {
  constructor(private readonly certificateRepository: CertificateRepository) {}

  async execute(): Promise<Certificate[]> {
    return this.certificateRepository.findAll();
  }
}

export class DeleteCertificateCommand {
  constructor(
    private readonly certificateRepository: CertificateRepository,
    private readonly fileStorage: FileStoragePort,
  ) {}

  async execute(id: string): Promise<void> {
    const certificate = await this.certificateRepository.findById(id);
    if (!certificate) {
      throw new NotFoundError(`Certificate with id ${id} not found`);
    }

    await this.fileStorage.delete(certificate.s3Key);
    await this.certificateRepository.delete(id);
  }
}
