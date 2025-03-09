"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const dynamo_1 = require("../utils/dynamo");
const config_1 = require("../config");
// import { Logger } from '../utils/logger';
class TransactionService {
    // private logger: Logger;
    constructor() {
        this.dynamo = new dynamo_1.DynamoDB();
        // this.logger = new Logger('transaction-service');
    }
    async getRecentTransactions(accountId) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const params = {
            TableName: config_1.config.tables.main,
            KeyConditionExpression: 'PK = :pk AND SK > :sk',
            ExpressionAttributeValues: {
                ':pk': `ACCOUNT#${accountId}`,
                ':sk': `TXN#${thirtyDaysAgo.toISOString()}`
            }
        };
        const result = await this.dynamo.query(params);
        return result.Items;
    }
    async createTransaction(accountId, transaction) {
        const timestamp = new Date().toISOString();
        const item = {
            PK: `ACCOUNT#${accountId}`,
            SK: `TXN#${transaction.date}#${this.generateHash(transaction)}`,
            ...transaction,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        await this.dynamo.put({
            TableName: config_1.config.tables.main,
            Item: item
        });
    }
    async replaceTransaction(accountId, transaction) {
        // First delete existing transaction if found
        // Then create new one
        await this.createTransaction(accountId, transaction);
    }
    generateHash(transaction) {
        // Simple hash function for demo
        return Buffer.from(JSON.stringify(transaction))
            .toString('base64')
            .slice(0, 8);
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=transaction.js.map