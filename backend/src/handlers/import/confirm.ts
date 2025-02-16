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