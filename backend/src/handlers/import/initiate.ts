import { APIGatewayProxyHandler, APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Logger } from '../../utils/logger';
import { ImportService } from '../../services/import';
import { validateToken } from '../../utils/auth';
import { validateImportRequest } from '../../utils/validation';

const logger = new Logger('import-initiate-handler');
const importService = new ImportService();

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent, 
  context: Context
) => {
  try {
    const userId = await validateToken(event.headers.Authorization);
    const request = JSON.parse(event.body || '{}');
    
    // Validate request
    validateImportRequest(request);
    
    const { accountId, fileName, fileType, contentType } = request;
    
    logger.info('Initiating import', { userId, accountId, fileName });
    
    // Generate upload URL and ID
    const uploadDetails = await importService.initiateImport({
      userId,
      accountId,
      fileName,
      fileType,
      contentType
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify(uploadDetails)
    };
    
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