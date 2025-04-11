import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

import { AppConfig } from '#/config';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { logs, NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

export class OpenTelemetry {
  private static instance: OpenTelemetry;
  private sdk: NodeSDK | null = null;

  private constructor() {}

  public static getInstance(): OpenTelemetry {
    if (!OpenTelemetry.instance) {
      OpenTelemetry.instance = new OpenTelemetry();
    }
    return OpenTelemetry.instance;
  }

  public async initialize(config: AppConfig): Promise<void> {
    if (this.sdk) {
      return;
    }

    const exporter = new OTLPTraceExporter({
      url: `${config.externalServices.otelCollector.host}/v1/traces`,
    });

    const resource = resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_VERSION]: config.serviceVersion,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: config.environment,
    });

    this.sdk = new NodeSDK({
      resource,
      spanProcessor: new BatchSpanProcessor(exporter),
      instrumentations: [getNodeAutoInstrumentations()],
      logRecordProcessor: new logs.SimpleLogRecordProcessor(
        new OTLPLogExporter({
          url: 'http://localhost:4318/v1/logs', // Ajusta si tu collector está en otra URL
        }),
      ),
    });

    this.sdk.start();
  }

  public async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
      this.sdk = null;
    }
  }
}
