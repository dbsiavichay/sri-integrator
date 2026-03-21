import { InvoiceSignerPort } from '../../domain/ports';
import { P12Reader } from '../signing/p12-reader';
import { XadesSigner } from '../signing/xades-signer';

export class LocalSignerAdapter implements InvoiceSignerPort {
  constructor(
    private readonly p12Reader: P12Reader,
    private readonly xadesSigner: XadesSigner,
  ) {}

  async signInvoice(xml: string): Promise<string> {
    const credentials = this.p12Reader.getCredentials();
    console.log(credentials);
    return this.xadesSigner.sign(xml, credentials);
  }
}
