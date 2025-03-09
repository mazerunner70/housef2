"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const account_1 = require("../../services/account");
const auth_1 = require("../../utils/auth");
const logger = new logger_1.Logger('account-list-handler');
const accountService = new account_1.AccountService();
const handler = async (event, context) => {
    try {
        // Validate token and get user ID
        const userId = await (0, auth_1.validateToken)(event.headers.Authorization);
        logger.info('Listing accounts', { userId });
        // Get accounts
        const accounts = await accountService.listAccounts(userId);
        // Calculate totals by currency
        const totalBalances = accounts.reduce((acc, account) => {
            const { currency, balance } = account;
            acc[currency] = (acc[currency] || 0) + balance;
            return acc;
        }, {});
        return {
            statusCode: 200,
            body: JSON.stringify({
                accounts,
                totalBalances,
                lastRefresh: new Date().toISOString()
            })
        };
    }
    catch (error) {
        logger.error('Error listing accounts', { error });
        const errorResponse = {
            statusCode: 500,
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred'
        };
        if (error instanceof Error) {
            errorResponse.message = error.message;
            if ('statusCode' in error)
                errorResponse.statusCode = error.statusCode;
            if ('code' in error)
                errorResponse.code = error.code;
        }
        return {
            statusCode: errorResponse.statusCode,
            body: JSON.stringify({
                error: {
                    code: errorResponse.code,
                    message: errorResponse.message,
                    requestId: context.awsRequestId
                }
            })
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=list.js.map