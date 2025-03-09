"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDB = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const logger_1 = require("./logger");
class DynamoDB {
    constructor() {
        const marshallOptions = {
            convertEmptyValues: true,
            removeUndefinedValues: true,
            convertClassInstanceToMap: true
        };
        const unmarshallOptions = {
            wrapNumbers: false
        };
        const translateConfig = { marshallOptions, unmarshallOptions };
        const client = new client_dynamodb_1.DynamoDBClient({});
        this.client = lib_dynamodb_1.DynamoDBDocumentClient.from(client, translateConfig);
        this.logger = new logger_1.Logger('dynamo-util');
    }
    async query(params) {
        try {
            const command = new lib_dynamodb_1.QueryCommand(params);
            return await this.client.send(command);
        }
        catch (error) {
            this.logger.error('DynamoDB query error', { error, params });
            throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async put(params) {
        try {
            const command = new lib_dynamodb_1.PutCommand(params);
            const result = await this.client.send(command);
            return result;
        }
        catch (error) {
            this.logger.error('DynamoDB put error', { error, params });
            throw error;
        }
    }
    async update(params) {
        try {
            const command = new lib_dynamodb_1.UpdateCommand(params);
            const result = await this.client.send(command);
            return result;
        }
        catch (error) {
            this.logger.error('DynamoDB update error', { error, params });
            throw error;
        }
    }
    async get(params) {
        try {
            const command = new lib_dynamodb_1.GetCommand(params);
            const result = await this.client.send(command);
            return result;
        }
        catch (error) {
            this.logger.error('DynamoDB get error', { error, params });
            throw error;
        }
    }
}
exports.DynamoDB = DynamoDB;
//# sourceMappingURL=dynamo.js.map