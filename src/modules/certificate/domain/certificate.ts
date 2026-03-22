import { randomUUID } from 'crypto';

export class Certificate {
  constructor(
    public readonly id: string,
    public readonly serialNumber: string,
    public readonly subject: string,
    public readonly issuer: string,
    public readonly validFrom: Date,
    public readonly validTo: Date,
    public readonly fileName: string,
    public readonly s3Key: string,
    public readonly s3Url: string,
    public readonly uploadedAt: Date,
  ) {}

  static create(props: {
    serialNumber: string;
    subject: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    fileName: string;
    s3Key: string;
    s3Url: string;
  }): Certificate {
    return new Certificate(
      randomUUID(),
      props.serialNumber,
      props.subject,
      props.issuer,
      props.validFrom,
      props.validTo,
      props.fileName,
      props.s3Key,
      props.s3Url,
      new Date(),
    );
  }
}
