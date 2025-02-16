import { DynamoDB } from '../utils/dynamo';
import { Logger } from '../utils/logger';

export class TransactionService {
  private dynamo: DynamoDB;
  private logger: Logger;

  constructor() {
    this.dynamo = new DynamoDB();
    this.logger = new Logger('transaction-service');
  }

  async getRecentTransactions(accountId: string): Promise<Transaction[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const params = {
      TableName: 'housef2-main',
      KeyConditionExpression: 'PK = :pk AND SK > :sk',
      ExpressionAttributeValues: {
        ':pk': `ACCOUNT#${accountId}`,
        ':sk': `TXN#${thirtyDaysAgo.toISOString()}`
      }
    };
    
    const result = await this.dynamo.query(params);
    return result.Items;
  }

  async createTransaction(accountId: string, transaction: Transaction) {
    const timestamp = new Date().toISOString();
    
    const item = {
      PK: `ACCOUNT#${accountId}`,
      SK: `TXN#${transaction.date}#${this.generateHash(transaction)}`,
      ...transaction,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await this.dynamo.put({
      TableName: 'housef2-main',
      Item: item
    });
  }

  async replaceTransaction(accountId: string, transaction: Transaction) {
    // First delete existing transaction if found
    // Then create new one
    await this.createTransaction(accountId, transaction);
  }

  private generateHash(transaction: Transaction): string {
    // Simple hash function for demo
    return Buffer.from(JSON.stringify(transaction))
      .toString('base64')
      .slice(0, 8);
  }
} 