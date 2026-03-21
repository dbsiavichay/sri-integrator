import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

import { Invoice } from '../domain/models';
import { InvoiceDTO } from '../app/dtos';
import { InvoiceRepository } from '../domain/repositories';
import { mapInvoiceToDomain, mapInvoiceToDTO } from '../app/mappers/invoice';

export class DynamoInvoiceRepository implements InvoiceRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
  ) {}

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: mapInvoiceToDTO(invoice),
      }),
    );
    return invoice;
  }

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: mapInvoiceToDTO(invoice),
      }),
    );
    return invoice;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoice = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    return invoice.Item ? mapInvoiceToDomain(invoice.Item as InvoiceDTO) : null;
  }
}
