import { InvoiceMessage, OrderMessage } from '#/modules/domain/models';
import { InvoiceMessageDTO, OrderMessageDTO } from '../dtos';

import { AutoRegisterMapper } from './decorator';
import { BaseMapper } from './base';
import { InvoiceStatus } from '#/modules/domain/constants';

@AutoRegisterMapper('orderMessage')
export class OrderMessageMapper extends BaseMapper<OrderMessageDTO, OrderMessage> {
  mapToDomain(dto: OrderMessageDTO): OrderMessage {
    return new OrderMessage(dto.id, dto.access_code, dto.sequence);
  }
}

@AutoRegisterMapper('invoiceMessage')
export class InvoiceMessageMapper extends BaseMapper<InvoiceMessageDTO, InvoiceMessage> {
  mapToDomain(dto: InvoiceMessageDTO): InvoiceMessage {
    //   const parsedInput = InvoiceMessageSchema.safeParse(dto);
    //   if (!parsedInput.success) {
    //     throw new Error(parsedInput.error.errors.join(', '));
    //   }

    //   const invoiceMessageInput = parsedInput.data;
    return new InvoiceMessage(dto.id, dto.orderId, dto.status as InvoiceStatus);
  }
}
