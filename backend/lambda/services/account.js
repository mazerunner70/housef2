"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const dynamo_1 = require("../utils/dynamo");
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
class AccountService {
    constructor() {
        this.dynamo = new dynamo_1.DynamoDB();
        this.logger = new logger_1.Logger('account-service');
    }
    async listAccounts(userId) {
        try {
            const params = {
                TableName: config_1.config.tables.main,
                KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
                ExpressionAttributeValues: {
                    ':pk': `USER#${userId}`,
                    ':sk': 'ACCOUNT#'
                }
            };
            const result = await this.dynamo.query(params);
            return (result.Items ?? []).map(this.mapToAccountSummary);
        }
        catch (error) {
            this.logger.error('Failed to list accounts', { userId, error });
            throw error;
        }
    }
    mapToAccountSummary(item) {
        return {
            accountId: item.accountId,
            accountName: item.accountName,
            institution: item.providerName,
            accountType: item.accountType,
            balance: item.balance,
            currency: item.currency,
            lastUpdated: item.lastUpdated,
            lastTransactionDate: item.lastTransactionDate,
            status: item.isActive ? 'ACTIVE' : 'INACTIVE'
        };
    }
}
exports.AccountService = AccountService;
//# sourceMappingURL=account.js.map