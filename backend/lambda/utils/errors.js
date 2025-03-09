"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
    }
}
exports.ValidationError = ValidationError;
class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError';
        this.statusCode = 401;
        this.code = 'AUTH_ERROR';
    }
}
exports.AuthError = AuthError;
//# sourceMappingURL=errors.js.map