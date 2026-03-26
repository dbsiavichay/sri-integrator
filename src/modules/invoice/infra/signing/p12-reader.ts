import * as forge from 'node-forge';

export interface SigningCredentials {
  certDer: Buffer;
  certBase64: string;
  keyDer: Buffer;
  issuerRfc4514: string;
  serialNumber: string;
  modulus: Buffer;
  exponent: Buffer;
}

const OID_SHORT_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '2.5.4.5': 'serialNumber',
};

function bigIntegerToBuffer(bigInt: forge.jsbn.BigInteger): Buffer {
  const hex = bigInt.toString(16);
  const paddedHex = hex.length % 2 === 0 ? hex : '0' + hex;
  return Buffer.from(paddedHex, 'hex');
}

function formatIssuerRfc4514(attributes: forge.pki.CertificateField[]): string {
  return [...attributes]
    .reverse()
    .map((attr) => {
      const name = attr.shortName || OID_SHORT_NAMES[attr.type as string] || attr.type;
      return `${name}=${attr.value}`;
    })
    .join(',');
}

export class P12Reader {
  private credentials: SigningCredentials | null = null;

  constructor(
    private readonly p12Buffer: Buffer,
    private readonly password: string,
  ) {}

  getCredentials(): SigningCredentials {
    if (this.credentials) return this.credentials;

    const p12Der = forge.util.decode64(this.p12Buffer.toString('base64'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, this.password);

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const keyBags = p12.getBags({
      bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });

    const certs = certBags[forge.pki.oids.certBag]?.filter((b) => b.cert) || [];
    const keys = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.filter((b) => b.key) || [];

    if (certs.length === 0) throw new Error('No certificates found in P12 file');
    if (keys.length === 0) throw new Error('No private keys found in P12 file');

    let signingCert = certs[0].cert!;
    let signingKey = keys[0].key! as forge.pki.rsa.PrivateKey;

    for (const certBag of certs) {
      for (const keyBag of keys) {
        const certLocalKeyId = certBag.attributes?.localKeyId?.[0];
        const keyLocalKeyId = keyBag.attributes?.localKeyId?.[0];
        if (certLocalKeyId && keyLocalKeyId && certLocalKeyId === keyLocalKeyId) {
          signingCert = certBag.cert!;
          signingKey = keyBag.key! as forge.pki.rsa.PrivateKey;
          break;
        }
      }
    }

    const certDerBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(signingCert)).getBytes();
    const certDer = Buffer.from(certDerBytes, 'binary');
    const certBase64 = certDer.toString('base64');

    const keyDerBytes = forge.asn1.toDer(forge.pki.privateKeyToAsn1(signingKey)).getBytes();
    const keyDer = Buffer.from(keyDerBytes, 'binary');

    const publicKey = signingCert.publicKey as forge.pki.rsa.PublicKey;

    this.credentials = {
      certDer,
      certBase64,
      keyDer,
      issuerRfc4514: formatIssuerRfc4514(signingCert.issuer.attributes),
      serialNumber: BigInt('0x' + signingCert.serialNumber).toString(),
      modulus: bigIntegerToBuffer(publicKey.n),
      exponent: bigIntegerToBuffer(publicKey.e),
    };

    return this.credentials;
  }
}
