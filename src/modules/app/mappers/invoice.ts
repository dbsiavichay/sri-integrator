import { Invoice, InvoiceStatusHistory } from '#/modules/domain/models';
import { InvoiceDTO } from '../dtos';
import { InvoiceStatus } from '#/modules/domain/constants';

export function mapInvoiceToDomain(dto: InvoiceDTO): Invoice {
  return new Invoice(
    dto.id,
    dto.orderId,
    dto.accessCode,
    dto.status as InvoiceStatus,
    dto.signatureId,
    dto.xml,
    dto.statusHistory.map(
      (h) =>
        new InvoiceStatusHistory(h.name as InvoiceStatus, new Date(h.statusDate), h.description),
    ),
  );
}

export function mapInvoiceToDTO(entity: Invoice): InvoiceDTO {
  return {
    id: entity.id,
    orderId: entity.orderId,
    accessCode: entity.accessCode,
    status: entity.status,
    signatureId: entity.signatureId,
    xml: entity.xml,
    statusHistory: entity.statusHistory.map((h) => ({
      name: h.name,
      statusDate: h.statusDate.toISOString(),
      description: h.description ?? '',
    })),
  };
}
