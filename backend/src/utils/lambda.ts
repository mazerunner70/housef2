import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { Logger } from './logger';

export class Lambda {
  private client: LambdaClient;
  private logger: Logger;

  constructor() {
    this.client = new LambdaClient({});
    this.logger = new Logger('lambda-util');
  }

  async invoke(params: {
    FunctionName: string;
    InvocationType: string;
    Payload: string;
  }) {
    try {
      const command = new InvokeCommand(params);
      const result = await this.client.send(command);
      return result;
    } catch (error) {
      this.logger.error('Lambda invoke error', { error, params });
      throw error;
    }
  }
} 