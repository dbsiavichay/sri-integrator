import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { CompanyConfig } from '../../domain/company-config';
import { CompanyConfigRepository } from '../../domain/repository';
import {
  CompanyConfigRecord,
  fromCompanyConfigRecord,
  toCompanyConfigRecord,
} from './company-config.mapper';

export class DynamoCompanyConfigRepository implements CompanyConfigRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
  ) {}

  async save(config: CompanyConfig): Promise<CompanyConfig> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toCompanyConfigRecord(config),
      }),
    );
    return config;
  }

  async find(): Promise<CompanyConfig | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id: CompanyConfig.SINGLETON_ID },
      }),
    );
    return result.Item ? fromCompanyConfigRecord(result.Item as CompanyConfigRecord) : null;
  }

  async nextInvoiceSequence(): Promise<number> {
    const result = await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id: CompanyConfig.SINGLETON_ID },
        UpdateExpression: 'ADD invoice_sequence :one',
        ExpressionAttributeValues: { ':one': 1 },
        ReturnValues: 'UPDATED_NEW',
      }),
    );
    return result.Attributes!.invoice_sequence as number;
  }
}
