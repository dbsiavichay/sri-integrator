import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

import { Invoice } from '../../domain/invoice';
import { InvoiceRepository } from '../../domain/repository';
import { fromInvoiceRecord, InvoiceRecord, toInvoiceRecord } from './invoice.mapper';

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

  async findAll(): Promise<Invoice[]> {
    const result = await this.docClient.send(new ScanCommand({ TableName: this.tableName }));
    return (result.Items ?? []).map((item) => fromInvoiceRecord(item as InvoiceRecord));
  }

  async findBySaleId(saleId: string): Promise<Invoice[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'SaleIdIndex',
        KeyConditionExpression: 'saleId = :saleId',
        ExpressionAttributeValues: { ':saleId': saleId },
      }),
    );
    return (result.Items ?? []).map((item) => fromInvoiceRecord(item as InvoiceRecord));
  }
}
