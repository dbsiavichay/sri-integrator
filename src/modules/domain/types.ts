export type Endpoint = {
  host: string;
  timeout: number;
  retries?: number;
  retriesDelay?: number;
};
