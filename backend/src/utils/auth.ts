import { CognitoJwtVerifier } from "aws-jwt-verify";
import { AuthError } from './errors';

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "access",
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