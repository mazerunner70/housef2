import { DynamoDB } from '../utils/dynamo';
import { Logger } from '../utils/logger';
import { Account, AccountSummary } from '../models/account';

export class AccountService {
  private dynamo: DynamoDB;
  private logger: Logger;

  constructor() {
    this.dynamo = new DynamoDB();
    this.logger = new Logger('account-service');
  }

  async listAccounts(userId: string): Promise<AccountSummary[]> {
    const params = {
      TableName: 'housef2-main',
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ACCOUNT#'
      }
    };

    const result = await this.dynamo.query(params);
    return result.Items.map(this.mapToAccountSummary);
  }

  private mapToAccountSummary(item: any): AccountSummary {
    return {
      accountId: item.accountId,
      accountName: item.accountName,
      institution: item.providerName,
      accountType: item.accountType,
      balance: item.balance,
      currency: item.currency,
      lastUpdated: item.lastUpdated,
      lastTransactionDate: item.lastTransactionDate,
      status: item.isActive ? 'ACTIVE' : 'INACTIVE'
    };
  }
} 