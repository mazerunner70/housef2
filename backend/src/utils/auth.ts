import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { AuthError } from './errors';
import { APIGatewayProxyEvent } from 'aws-lambda';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.COGNITO_CLIENT_ID!
});

export async function validateToken(token?: string): Promise<string> {
  if (!token) {
    throw new AuthError('No token provided');
  }

  try {
    const payload = await verifier.verify(token.replace('Bearer ', ''));
    return payload.sub;
  } catch (error) {
    throw new AuthError('Invalid token');
  }
}

/**
 * Extract the user ID from an API Gateway event
 * @param event The API Gateway event
 * @returns The user ID from the event's claims
 * @throws {AuthError} If the user ID is not found in the event
 */
export function getUserIdFromEvent(event: APIGatewayProxyEvent): string {
  const claims = event.requestContext.authorizer?.claims;
  if (!claims?.sub) {
    throw new AuthError('User ID not found in event');
  }
  return claims.sub;
} 