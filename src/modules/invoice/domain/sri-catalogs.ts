// tax_type (event) → SRI identification code (Tabla 6)
export const TAX_TYPE_CODES: Record<string, string> = {
  RUC: '04',
  NATIONAL_ID: '05',
  PASSPORT: '06',
  FOREIGN_ID: '07',
};

// payment method (event) → SRI formaPago code (Tabla 24)
export const PAYMENT_METHOD_CODES: Record<string, string> = {
  CASH: '01',
  DEBIT_CARD: '16',
  CREDIT_CARD: '19',
  TRANSFER: '20',
  OTHER: '20',
};

// tax_rate integer string → SRI codigoPorcentaje (Tabla 17)
export const TAX_RATE_CODES: Record<string, number> = {
  '0': 0,
  '5': 5,
  '8': 8,
  '12': 2,
  '13': 10,
  '15': 4,
};
