import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Invoice } from '../../domain/invoice';
import { InvoiceRepository } from '../../domain/repository';
import { InvoiceRecord, fromInvoiceRecord, toInvoiceRecord } from './invoice.mapper';

export class DynamoInvoiceRepository implements InvoiceRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
  ) {}

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toInvoiceRecord(invoice),
      }),
    );
    return invoice;
  }

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toInvoiceRecord(invoice),
      }),
    );
    return invoice;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    return result.Item ? fromInvoiceRecord(result.Item as InvoiceRecord) : null;
  }
}
