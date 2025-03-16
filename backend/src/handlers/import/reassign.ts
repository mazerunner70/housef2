import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ImportService } from '../../services/import';
import { Logger } from '../../utils/logger';
import { ValidationError } from '../../utils/errors';

/**
 * Handler for reassigning an import to a different account
 * @param event - The API Gateway event
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const logger = new Logger('import-reassign-handler');
  const importService = new ImportService();
  
  try {
    logger.info('Received request to reassign import', { event });
    
    // Extract parameters from the request
    const { uploadId } = event.pathParameters || {};
    const { currentAccountId, newAccountId } = JSON.parse(event.body || '{}');
    
    // Get user ID from Cognito authorizer
    const userId = event.requestContext.authorizer?.claims?.sub;
    
    // Validate required parameters
    if (!uploadId) {
      throw new ValidationError('Missing required parameter: uploadId');
    }
    
    if (!currentAccountId) {
      throw new ValidationError('Missing required parameter: currentAccountId');
    }
    
    if (!newAccountId) {
      throw new ValidationError('Missing required parameter: newAccountId');
    }
    
    if (!userId) {
      throw new ValidationError('User ID not found in request');
    }
    
    // Call the service to update the account assignment
    const result = await importService.updateAccountAssignment({
      uploadId,
      currentAccountId,
      newAccountId,
      userId
    });
    
    logger.info('Import reassigned successfully', { result });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    logger.error('Error reassigning import', { error });
    
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
        message: 'An error occurred while reassigning the import'
      })
    };
  }
}; 