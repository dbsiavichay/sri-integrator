import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

import { Certificate } from '../../domain/certificate';
import { CertificateRepository } from '../../domain/repository';
import {
  CertificateRecord,
  fromCertificateRecord,
  toCertificateRecord,
} from './certificate.mapper';

export class DynamoCertificateRepository implements CertificateRepository {
  constructor(
    private docClient: DynamoDBDocumentClient,
    private tableName: string,
  ) {}

  async save(certificate: Certificate): Promise<Certificate> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toCertificateRecord(certificate),
      }),
    );
    return certificate;
  }

  async findById(id: string): Promise<Certificate | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
    return result.Item ? fromCertificateRecord(result.Item as CertificateRecord) : null;
  }

  async findAll(): Promise<Certificate[]> {
    const result = await this.docClient.send(new ScanCommand({ TableName: this.tableName }));
    return (result.Items ?? []).map((item) => fromCertificateRecord(item as CertificateRecord));
  }

  async findBySerialNumber(serialNumber: string): Promise<Certificate | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'SerialNumberIndex',
        KeyConditionExpression: 'serial_number = :sn',
        ExpressionAttributeValues: { ':sn': serialNumber },
        Limit: 1,
      }),
    );
    return result.Items?.[0] ? fromCertificateRecord(result.Items[0] as CertificateRecord) : null;
  }

  async delete(id: string): Promise<void> {
    await this.docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );
  }
}
