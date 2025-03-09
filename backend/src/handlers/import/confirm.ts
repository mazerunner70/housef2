import { APIGatewayProxyHandler } from 'aws-lambda';
import { Logger } from '../../utils/logger';
import { ImportService } from '../../services/import';
import { validateToken } from '../../utils/auth';
import { validateConfirmation } from '../../utils/validation';

const logger = new Logger('import-confirm-handler');
const importService = new ImportService();

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    const userId = await validateToken(event.headers.Authorization);
    const { accountId, uploadId } = event.pathParameters || {};
    
    if (!accountId || !uploadId) {
      throw new Error('Missing required path parameters');
    }

    const request = JSON.parse(event.body || '{}');
    
    // Validate request
    validateConfirmation(request);
    
    logger.info('Confirming import', { userId, accountId, uploadId });
    
    // Get import status
    const importStatus = await importService.getImportStatus(accountId, uploadId);
    
    // Verify user owns this import
    if (importStatus.userId !== userId) {
      throw new Error('Unauthorized');
    }
    
    // Start processing
    await importService.confirmImport({
      accountId,
      uploadId,
      userConfirmations: request.userConfirmations,
      duplicateHandling: request.duplicateHandling
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'PROCESSING'
      })
    };
    
  } catch (error) {
    logger.error('Error confirming import', { error });
    
    const errorResponse = {
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    };

    if (error instanceof Error) {
      errorResponse.message = error.message;
      if ('statusCode' in error) errorResponse.statusCode = (error as any).statusCode;
      if ('code' in error) errorResponse.code = (error as any).code;
    }
    
    return {
      statusCode: errorResponse.statusCode,
      body: JSON.stringify({
        error: {
          code: errorResponse.code,
          message: errorResponse.message,
          requestId: context.awsRequestId
        }
      })
    };
  }
}; 