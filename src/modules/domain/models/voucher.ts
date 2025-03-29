import { AuthorizationVoucherStatus, ValidationVoucherStatus } from '../constants';

export class ValidationVoucher {
  constructor(
    public readonly status: ValidationVoucherStatus,
    public readonly code: string | null,
    public readonly messages: string[] = [],
  ) {}
}

export class AuthorizationVoucher {
  constructor(
    public readonly status: AuthorizationVoucherStatus | null,
    public readonly code: string | null,
    public readonly authorizationDate: Date | null,
    public readonly messages: string[] = [],
  ) {}
}
