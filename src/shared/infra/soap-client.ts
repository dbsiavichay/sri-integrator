// eslint-disable-next-line @typescript-eslint/no-require-imports
const { soap } = require('strong-soap');

type SoapMethod = (
  args: Record<string, unknown>,
  callback: (err: Error | null, result: unknown) => void,
) => void;

interface SoapClientInstance {
  describe(): Record<string, unknown>;
  [methodName: string]: SoapMethod | (() => Record<string, unknown>);
}

export class SoapClient {
  private wsdlUrl: string;
  private client: SoapClientInstance | null = null;

  constructor(wsdlUrl: string) {
    this.wsdlUrl = wsdlUrl;
  }

  private async initClient(): Promise<void> {
    if (this.client) return;

    this.client = await new Promise<SoapClientInstance>((resolve, reject) => {
      soap.createClient(this.wsdlUrl, {}, (err: Error | null, client: SoapClientInstance) => {
        if (err) return reject(err);
        resolve(client);
      });
    });
  }

  async describe(): Promise<Record<string, unknown>> {
    await this.initClient();
    return this.client!.describe();
  }

  async callMethod(methodName: string, args: Record<string, unknown>): Promise<unknown> {
    await this.initClient();

    return new Promise((resolve, reject) => {
      const method = this.client![methodName];
      if (typeof method !== 'function') {
        return reject(new Error(`Método '${methodName}' no encontrado en el cliente SOAP.`));
      }

      (method as SoapMethod)(args, (err: Error | null, result: unknown) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
}
