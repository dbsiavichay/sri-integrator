import { soap } from 'strong-soap';

export class SoapClient {
  private wsdlUrl: string;
  private client: any | null = null;

  constructor(wsdlUrl: string) {
    this.wsdlUrl = wsdlUrl;
  }

  private async initClient(): Promise<void> {
    if (this.client) return;

    this.client = await new Promise((resolve, reject) => {
      soap.createClient(this.wsdlUrl, {}, (err, client) => {
        if (err) return reject(err);
        resolve(client);
      });
    });
  }

  async describe(): Promise<any> {
    await this.initClient();
    return this.client.describe();
  }

  async callMethod(methodName: string, args: any): Promise<any> {
    await this.initClient();

    return new Promise((resolve, reject) => {
      const method = this.client[methodName];
      if (typeof method !== 'function') {
        return reject(new Error(`Método '${methodName}' no encontrado en el cliente SOAP.`));
      }

      method(args, (err: any, result: any) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  }
}
