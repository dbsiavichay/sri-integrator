export class NonRetryableError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'NonRetryableError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
