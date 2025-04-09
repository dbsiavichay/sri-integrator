import { AppConfig } from '../config';
import { OpenTelemetry } from '#/modules/infra/adapters';

export async function initTelemetry(config: AppConfig) {
  const telemetry = OpenTelemetry.getInstance();
  await telemetry.initialize(config);
}

export async function shutdownTelemetry() {
  const telemetry = OpenTelemetry.getInstance();
  await telemetry.shutdown();
}
