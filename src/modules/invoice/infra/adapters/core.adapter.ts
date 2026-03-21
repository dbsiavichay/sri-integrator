import { ZodSchema } from 'zod';

import { BaseHttpClient } from '#/shared/infra/http-client';
import { logger } from '#/shared/logger';
import { Endpoint } from '#/shared/types';

import { Order } from '../../domain/order';
import { CorePort } from '../../domain/ports';
import { mapOrderToDomain } from '../mappers/order.mapper';
import { OrderResponse } from '../messaging/schemas';

export class CoreAdapter extends BaseHttpClient implements CorePort {
  constructor(
    endpoint: Endpoint,
    private validator: ZodSchema<OrderResponse>,
  ) {
    super({ baseURL: endpoint.host });
  }

  async retrieveOrder(orderId: number): Promise<Order> {
    const response = await this.get(`/api/invoice/${orderId}/`);
    const parsedResponse = this.validator.safeParse(response.data);
    if (parsedResponse.error) {
      logger.error({ error: parsedResponse.error.stack }, 'Invalid order response');
      throw new Error(parsedResponse.error.errors.join(', '));
    }
    return mapOrderToDomain(parsedResponse.data);
  }
}
