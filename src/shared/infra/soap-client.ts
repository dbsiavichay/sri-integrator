// eslint-disable-next-line @typescript-eslint/no-require-imports
const { soap } = require('strong-soap');

import { SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';

import { soapCallDuration } from '../telemetry/metrics';

const tracer = trace.getTracer('faclab-invoicing.soap');

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
  private serverAddress: string;

  constructor(wsdlUrl: string) {
    this.wsdlUrl = wsdlUrl;
    try {
      this.serverAddress = new URL(wsdlUrl).hostname;
    } catch {
      this.serverAddress = wsdlUrl;
    }
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

    const span = tracer.startSpan(`SRI ${methodName}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'rpc.system': 'soap',
        'rpc.method': methodName,
        'server.address': this.serverAddress,
      },
    });

    const startTime = performance.now();

    try {
      const result = await new Promise((resolve, reject) => {
        const method = this.client![methodName];
        if (typeof method !== 'function') {
          return reject(new Error(`Método '${methodName}' no encontrado en el cliente SOAP.`));
        }

        (method as SoapMethod)(args, (err: Error | null, result: unknown) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      soapCallDuration.record(performance.now() - startTime, {
        method: methodName,
        status: 'success',
      });

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      soapCallDuration.record(performance.now() - startTime, {
        method: methodName,
        status: 'error',
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
