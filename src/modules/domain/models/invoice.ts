import { InvoiceStatus } from '../constants';
import { v4 as uuidv4 } from 'uuid';

export class Invoice {
  constructor(
    public id: string = uuidv4(),
    public orderId: string,
    public status: InvoiceStatus,
    public signatureId: string,
    public xml?: string | null,
    public signedXml?: string | null,
    public authorizedXml?: string | null,
  ) {}
}
