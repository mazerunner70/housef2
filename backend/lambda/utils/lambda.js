"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lambda = void 0;
const client_lambda_1 = require("@aws-sdk/client-lambda");
const logger_1 = require("./logger");
class Lambda {
    constructor() {
        this.client = new client_lambda_1.LambdaClient({});
        this.logger = new logger_1.Logger('lambda-util');
    }
    async invoke(params) {
        try {
            const command = new client_lambda_1.InvokeCommand(params);
            const result = await this.client.send(command);
            return result;
        }
        catch (error) {
            this.logger.error('Lambda invoke error', { error, params });
            throw error;
        }
    }
}
exports.Lambda = Lambda;
//# sourceMappingURL=lambda.js.map