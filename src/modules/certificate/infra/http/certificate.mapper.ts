import { Certificate } from '../../domain/certificate';

export function toResponse(cert: Certificate) {
  return {
    id: cert.id,
    serialNumber: cert.serialNumber,
    subject: cert.subject,
    issuer: cert.issuer,
    validFrom: cert.validFrom.toISOString(),
    validTo: cert.validTo.toISOString(),
    fileName: cert.fileName,
    s3Url: cert.s3Url,
    uploadedAt: cert.uploadedAt.toISOString(),
  };
}
