import * as forge from 'node-forge';

import { formatRfc4514, parseP12 } from '#/shared/infra/p12';

export interface SigningCredentials {
  certDer: Buffer;
  certBase64: string;
  keyDer: Buffer;
  issuerRfc4514: string;
  serialNumber: string;
  modulus: Buffer;
  exponent: Buffer;
}

function bigIntegerToBuffer(bigInt: forge.jsbn.BigInteger): Buffer {
  const hex = bigInt.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
  return Buffer.from(paddedHex, 'hex');
}

export class P12Reader {
  private credentials: SigningCredentials | null = null;

  constructor(
    private readonly p12Buffer: Buffer,
    private readonly password: string,
  ) {}

  getCredentials(): SigningCredentials {
    if (this.credentials) return this.credentials;

    const { certificate, privateKey } = parseP12(this.p12Buffer, this.password);

    const certDerBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(certificate)).getBytes();
    const certDer = Buffer.from(certDerBytes, 'binary');
    const certBase64 = certDer.toString('base64');

    const keyDerBytes = forge.asn1.toDer(forge.pki.privateKeyToAsn1(privateKey)).getBytes();
    const keyDer = Buffer.from(keyDerBytes, 'binary');

    const publicKey = certificate.publicKey as forge.pki.rsa.PublicKey;

    this.credentials = {
      certDer,
      certBase64,
      keyDer,
      issuerRfc4514: formatRfc4514(certificate.issuer.attributes),
      serialNumber: BigInt('0x' + certificate.serialNumber).toString(),
      modulus: bigIntegerToBuffer(publicKey.n),
      exponent: bigIntegerToBuffer(publicKey.e),
    };

    return this.credentials;
  }
}
