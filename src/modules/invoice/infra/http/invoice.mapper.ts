import { Invoice } from '../../domain/invoice';

export function toSummaryResponse(invoice: Invoice) {
  return {
    id: invoice.id,
    saleId: invoice.saleId,
    accessCode: invoice.accessCode.value,
    status: invoice.status,
    signatureId: invoice.signatureId,
    statusHistory: invoice.statusHistory.map((h) => ({
      name: h.name,
      statusDate: h.statusDate.toISOString(),
      description: h.description ?? '',
    })),
  };
}

export function toDetailResponse(invoice: Invoice) {
  return {
    ...toSummaryResponse(invoice),
    xml: invoice.xml,
  };
}
