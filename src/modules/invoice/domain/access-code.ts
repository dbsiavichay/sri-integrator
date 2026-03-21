export class AccessCode {
  private static readonly PATTERN = /^\d{49}$/;

  private constructor(public readonly value: string) {}

  static create(value: string): AccessCode {
    if (!AccessCode.PATTERN.test(value)) {
      throw new Error(`Invalid access code: must be exactly 49 digits, got "${value}"`);
    }
    return new AccessCode(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: AccessCode): boolean {
    return this.value === other.value;
  }
}
