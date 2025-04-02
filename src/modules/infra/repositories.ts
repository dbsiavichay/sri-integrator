import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

import { Invoice } from '../domain/models';
import { InvoiceDTO } from '../app/dtos';
import { InvoiceRepository } from '../domain/repositories';
import { Mapper } from '../app/mappers';

export class DynamoInvoiceRepository implements InvoiceRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
    private mapper: Mapper<InvoiceDTO, Invoice>,
  ) {}
  async createInvoice(invoice: Invoice): Promise<Invoice> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: this.mapper.toDTO(invoice),
      }),
    );
    return invoice;
  }

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: this.mapper.toDTO(invoice),
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
    return invoice.Item ? this.mapper.toDomain(invoice.Item as InvoiceDTO) : null;
  }
}
