import { InvokeCommand, InvokeCommandInput, LambdaClient } from '@aws-sdk/client-lambda';
import { Logger } from './logger';

export class Lambda {
  private client: LambdaClient;
  private logger: Logger;

  constructor() {
    this.client = new LambdaClient({});
    this.logger = new Logger('lambda-util');
  }

  async invoke(params: InvokeCommandInput): Promise<any> {
    try {
      const command = new InvokeCommand(params);
      const result = await this.client.send(command);
      
      if (result.FunctionError) {
        this.logger.error('Lambda invocation error', { error: result.FunctionError, params });
        throw new Error(`Lambda invocation error: ${result.FunctionError}`);
      }
      
      if (result.Payload) {
        return JSON.parse(Buffer.from(result.Payload).toString());
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error invoking Lambda', { error, params });
      throw error;
    }
  }
}

/**
 * Creates a standardized API response with CORS headers
 * @param statusCode - HTTP status code
 * @param body - Response body (will be JSON stringified)
 * @returns API Gateway proxy result
 */
export function createApiResponse(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
} 