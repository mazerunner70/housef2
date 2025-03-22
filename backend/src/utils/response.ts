import { APIGatewayProxyResult } from 'aws-lambda';

/**
 * Create a successful API Gateway response
 * @param body The response body
 * @param statusCode The HTTP status code (default: 200)
 * @returns An API Gateway response object
 */
export function successResponse(body: any, statusCode: number = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body)
  };
}

/**
 * Create an error API Gateway response
 * @param error The error message or object
 * @param statusCode The HTTP status code (default: 500)
 * @returns An API Gateway response object
 */
export function errorResponse(error: any, statusCode: number = 500): APIGatewayProxyResult {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify({
      error: errorMessage,
      statusCode
    })
  };
} 