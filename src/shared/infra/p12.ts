import * as forge from 'node-forge';

export interface P12Container {
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.rsa.PrivateKey;
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

export function formatRfc4514(attributes: forge.pki.CertificateField[]): string {
  return [...attributes]
    .reverse()
    .map((attr) => {
      const name = attr.shortName || OID_SHORT_NAMES[attr.type as string] || attr.type;
      return `${name}=${attr.value}`;
    })
    .join(',');
}

export function parseP12(buffer: Buffer, password: string): P12Container {
  const p12Der = forge.util.decode64(buffer.toString('base64'));
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });

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

  return { certificate: signingCert, privateKey: signingKey };
}
