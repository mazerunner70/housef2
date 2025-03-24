import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { getUserIdFromEvent } from '../../utils/auth';
import { Logger } from '../../utils/logger';
import { ImportListItem } from '@shared/types/import';

const dynamodb = new DynamoDB.DocumentClient();
const logger = new Logger('list-paginated-imports');

const TABLE_NAME = process.env.IMPORT_STATUS_TABLE || 'housef2-imports';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface DynamoKey {
  PK: string;
  SK: string;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);
    const limit = Math.min(
      parseInt(event.queryStringParameters?.limit || String(DEFAULT_LIMIT), 10),
      MAX_LIMIT
    );
    const nextToken = event.queryStringParameters?.nextToken;
    const lastEvaluatedKey = nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) as DynamoKey : undefined;

    const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`
      },
      Limit: limit,
      ScanIndexForward: false, // Sort in descending order (most recent first)
      ExclusiveStartKey: lastEvaluatedKey
    };

    const result = await dynamodb.query(params).promise();

    const items = (result.Items || []).map(item => ({
      uploadId: item.SK.replace('IMPORT#', ''),
      fileName: item.fileName,
      fileType: item.fileType,
      uploadTime: item.uploadTime,
      status: item.status,
      matchedAccountId: item.matchedAccountId,
      matchedAccountName: item.matchedAccountName,
      fileStats: item.fileStats,
      error: item.error
    })) as ImportListItem[];

    const response = {
      items,
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
        : undefined
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
  } catch (error: unknown) {
    const errorRecord: Record<string, any> = {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error
    };
    if (error instanceof Error && error.stack) {
      errorRecord.stack = error.stack;
    }
    logger.error('Error listing paginated imports:', errorRecord);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
}; 