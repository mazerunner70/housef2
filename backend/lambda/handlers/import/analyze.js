"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("../../utils/logger");
const import_1 = require("../../services/import");
const transaction_1 = require("../../services/transaction");
const logger = new logger_1.Logger('import-analyze-handler');
const importService = new import_1.ImportService();
const transactionService = new transaction_1.TransactionService();
const handler = async (event) => {
    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key);
            logger.info('Analyzing import file', { bucket, key });
            // Extract metadata from key
            const { accountId, uploadId } = importService.parseS3Key(key);
            // Get existing transactions for overlap period
            const existingTransactions = await transactionService.getRecentTransactions(accountId);
            // Analyze file content
            const analysis = await importService.analyzeImportFile({
                bucket,
                key,
                accountId,
                existingTransactions
            });
            // Update import status with analysis
            await importService.updateImportStatus({
                uploadId,
                accountId,
                status: 'ANALYZED',
                analysisData: analysis
            });
        }
    }
    catch (error) {
        logger.error('Error analyzing import', { error });
        throw error;
    }
};
exports.handler = handler;
//# sourceMappingURL=analyze.js.map