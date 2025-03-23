import { APIGatewayProxyHandler, APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Logger } from '../../utils/logger';
import { ImportService } from '../../services/import';
import { validateToken, getUserIdFromEvent } from '../../utils/auth';
import { validateImportRequest } from '../../utils/validation';
import { successResponse, errorResponse } from '../../utils/response';

const logger = new Logger('import-initiate-handler');
const importService = new ImportService();

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent, 
  context: Context
) => {
  try {
    const userId = getUserIdFromEvent(event);
    const body = JSON.parse(event.body || '{}');
    const { accountId, fileType } = body;

    if (!accountId || !fileType) {
      return errorResponse('Account ID and file type are required', 400);
    }

    // Validate file type
    const allowedTypes = ['csv', 'ofx', 'qif'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return errorResponse(`Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`, 400);
    }

    logger.info('Initiating import', { userId, accountId, fileType });
    
    const result = await importService.initiateImport(userId, accountId, fileType);
    return successResponse(result);
  } catch (error: unknown) {
    logger.error('Error initiating import', { error });
    
    const errorResponse = {
      code: error instanceof Error ? (error as any).code || 'INTERNAL_ERROR' : 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      requestId: context.awsRequestId
    };
    
    return {
      statusCode: error instanceof Error ? (error as any).statusCode || 500 : 500,
      body: JSON.stringify({ error: errorResponse })
    };
  }
}; 