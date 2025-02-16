import { APIGatewayProxyHandler } from 'aws-lambda';
import { Logger } from '../../utils/logger';
import { AccountService } from '../../services/account';
import { validateToken } from '../../utils/auth';

const logger = new Logger('account-list-handler');
const accountService = new AccountService();

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    // Validate token and get user ID
    const userId = await validateToken(event.headers.Authorization);
    
    logger.info('Listing accounts', { userId });
    
    // Get accounts
    const accounts = await accountService.listAccounts(userId);
    
    // Calculate totals by currency
    const totalBalances = accounts.reduce((acc, account) => {
      const { currency, balance } = account;
      acc[currency] = (acc[currency] || 0) + balance;
      return acc;
    }, {} as Record<string, number>);

    return {
      statusCode: 200,
      body: JSON.stringify({
        accounts,
        totalBalances,
        lastRefresh: new Date().toISOString()
      })
    };
  } catch (error) {
    logger.error('Error listing accounts', { error });
    
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          requestId: context.awsRequestId
        }
      })
    };
  }
}; 