"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateToken = void 0;
const aws_jwt_verify_1 = require("aws-jwt-verify");
const errors_1 = require("./errors");
const verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID,
    tokenUse: 'access',
    clientId: process.env.COGNITO_CLIENT_ID
});
async function validateToken(token) {
    if (!token) {
        throw new errors_1.AuthError('No token provided');
    }
    try {
        const payload = await verifier.verify(token.replace('Bearer ', ''));
        return payload.sub;
    }
    catch (error) {
        throw new errors_1.AuthError('Invalid token');
    }
}
exports.validateToken = validateToken;
//# sourceMappingURL=auth.js.map