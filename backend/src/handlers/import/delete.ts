import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ImportService } from '../../services/import';
import { Logger } from '../../utils/logger';
import { ValidationError } from '../../utils/errors';

/**
 * Handler for deleting an import
 * @param event - The API Gateway event
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const logger = new Logger('import-delete-handler');
  const importService = new ImportService();
  
  try {
    logger.info('Received request to delete import', { event });
    
    // Extract parameters from the request
    const { uploadId } = event.pathParameters || {};
    const accountId = event.pathParameters?.accountId;
    
    // Get user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub;
    
    // Validate required parameters
    if (!uploadId) {
      throw new ValidationError('Missing required parameter: uploadId');
    }
    
    if (!accountId) {
      throw new ValidationError('Missing required parameter: accountId');
    }
    
    if (!userId) {
      throw new ValidationError('User ID not found in request');
    }
    
    // Call the service to delete the import
    await importService.deleteImport(accountId, uploadId);
    
    logger.info('Import deleted successfully', { accountId, uploadId });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Import deleted successfully'
      })
    };
  } catch (error) {
    logger.error('Error deleting import', { error });
    
    if (error instanceof ValidationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
          message: error.message
        })
      };
    }
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'An error occurred while deleting the import'
      })
    };
  }
}; 