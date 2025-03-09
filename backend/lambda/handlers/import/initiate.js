"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const import_1 = require("../../services/import");
const auth_1 = require("../../utils/auth");
const validation_1 = require("../../utils/validation");
const logger = new logger_1.Logger('import-initiate-handler');
const importService = new import_1.ImportService();
const handler = async (event, context) => {
    try {
        const userId = await (0, auth_1.validateToken)(event.headers.Authorization);
        const request = JSON.parse(event.body || '{}');
        // Validate request
        (0, validation_1.validateImportRequest)(request);
        const { accountId, fileName, fileType, contentType } = request;
        logger.info('Initiating import', { userId, accountId, fileName });
        // Generate upload URL and ID
        const uploadDetails = await importService.initiateImport({
            userId,
            accountId,
            fileName,
            fileType,
            contentType
        });
        return {
            statusCode: 200,
            body: JSON.stringify(uploadDetails)
        };
    }
    catch (error) {
        logger.error('Error initiating import', { error });
        const errorResponse = {
            code: error instanceof Error ? error.code || 'INTERNAL_ERROR' : 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
            requestId: context.awsRequestId
        };
        return {
            statusCode: error instanceof Error ? error.statusCode || 500 : 500,
            body: JSON.stringify({ error: errorResponse })
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=initiate.js.map