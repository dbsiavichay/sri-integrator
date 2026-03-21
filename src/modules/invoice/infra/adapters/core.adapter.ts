import { BaseHttpClient } from '#/shared/infra/http-client';
import { Endpoint } from '#/shared/types';
import { logger } from '#/shared/logger';
import { CorePort } from '../../domain/ports';
import { Order } from '../../domain/order';
import { OrderResponse } from '../messaging/schemas';
import { mapOrderToDomain } from '../mappers/order.mapper';
import { ZodSchema } from 'zod';

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
