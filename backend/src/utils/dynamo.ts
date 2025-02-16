import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from './logger';

export class DynamoDB {
  private client: DynamoDBDocumentClient;
  private logger: Logger;

  constructor() {
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true
    };

    const unmarshallOptions = {
      wrapNumbers: false
    };

    const translateConfig = { marshallOptions, unmarshallOptions };
    
    const client = new DynamoDBClient({});
    this.client = DynamoDBDocumentClient.from(client, translateConfig);
    this.logger = new Logger('dynamo-util');
  }

  async query(params: any) {
    try {
      const command = new QueryCommand(params);
      const result = await this.client.send(command);
      return result;
    } catch (error) {
      this.logger.error('DynamoDB query error', { error, params });
      throw error;
    }
  }

  async put(params: any) {
    try {
      const command = new PutCommand(params);
      const result = await this.client.send(command);
      return result;
    } catch (error) {
      this.logger.error('DynamoDB put error', { error, params });
      throw error;
    }
  }

  async update(params: any) {
    try {
      const command = new UpdateCommand(params);
      const result = await this.client.send(command);
      return result;
    } catch (error) {
      this.logger.error('DynamoDB update error', { error, params });
      throw error;
    }
  }

  async get(params: any) {
    try {
      const command = new GetCommand(params);
      const result = await this.client.send(command);
      return result;
    } catch (error) {
      this.logger.error('DynamoDB get error', { error, params });
      throw error;
    }
  }
} 