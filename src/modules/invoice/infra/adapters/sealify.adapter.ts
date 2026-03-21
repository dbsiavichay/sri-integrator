import { ZodSchema } from 'zod';

import { BaseHttpClient } from '#/shared/infra/http-client';
import { Endpoint } from '#/shared/types';

import { SealifyPort } from '../../domain/ports';
import { SealInvoiceResponse } from '../messaging/schemas';

export class SealifyAdapter extends BaseHttpClient implements SealifyPort {
  constructor(
    endpoint: Endpoint,
    private validator: ZodSchema<SealInvoiceResponse>,
  ) {
    super({ baseURL: endpoint.host });
  }

  async sealInvoice(xml: string, certificateId: string): Promise<string> {
    const response = await this.post(`/api/certificates/${certificateId}/seal-invoice`, {
      invoiceXML: xml,
    });
    const parsedResponse = this.validator.safeParse(response.data);
    if (parsedResponse.error) {
      throw new Error(parsedResponse.error.errors.join(', '));
    }
    return parsedResponse.data.sealedData;
  }
}
