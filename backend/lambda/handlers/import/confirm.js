"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const import_1 = require("../../services/import");
const auth_1 = require("../../utils/auth");
const validation_1 = require("../../utils/validation");
const logger = new logger_1.Logger('import-confirm-handler');
const importService = new import_1.ImportService();
const handler = async (event, context) => {
    try {
        const userId = await (0, auth_1.validateToken)(event.headers.Authorization);
        const { accountId, uploadId } = event.pathParameters || {};
        if (!accountId || !uploadId) {
            throw new Error('Missing required path parameters');
        }
        const request = JSON.parse(event.body || '{}');
        // Validate request
        (0, validation_1.validateConfirmation)(request);
        logger.info('Confirming import', { userId, accountId, uploadId });
        // Get import status
        const importStatus = await importService.getImportStatus(accountId, uploadId);
        // Verify user owns this import
        if (importStatus.userId !== userId) {
            throw new Error('Unauthorized');
        }
        // Start processing
        await importService.confirmImport({
            accountId,
            uploadId,
            userConfirmations: request.userConfirmations,
            duplicateHandling: request.duplicateHandling
        });
        return {
            statusCode: 200,
            body: JSON.stringify({
                status: 'PROCESSING'
            })
        };
    }
    catch (error) {
        logger.error('Error confirming import', { error });
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
//# sourceMappingURL=confirm.js.map