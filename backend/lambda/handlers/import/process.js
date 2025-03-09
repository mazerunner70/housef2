"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.importService = void 0;
const logger_1 = require("../../utils/logger");
const import_1 = require("../../services/import");
const transaction_1 = require("../../services/transaction");
const logger = new logger_1.Logger('import-process-handler');
exports.importService = new import_1.ImportService();
const transactionService = new transaction_1.TransactionService();
const handler = async (event) => {
    try {
        const { accountId, uploadId, duplicateHandling } = event;
        logger.info('Processing import', { accountId, uploadId });
        // Get import status and analysis
        const importStatus = await exports.importService.getImportStatus(accountId, uploadId);
        console.log('importStatus', importStatus);
        // Get file content
        const fileContent = await exports.importService.getImportFile(accountId, uploadId);
        // Parse transactions
        const transactions = await exports.importService.parseTransactions(fileContent);
        // Process transactions based on duplicate handling strategy
        const result = await processTransactions({
            accountId,
            transactions,
            duplicateHandling,
            existingTransactions: importStatus.analysisData.sampleTransactions.existing
        });
        // Update import status
        await exports.importService.updateImportStatus({
            accountId,
            uploadId,
            status: 'COMPLETED',
            analysisData: {
                fileStats: {
                    transactionCount: transactions.length,
                    dateRange: {
                        start: transactions[0]?.date || new Date().toISOString(),
                        end: transactions[transactions.length - 1]?.date || new Date().toISOString()
                    }
                },
                overlapStats: {
                    existingTransactions: importStatus.analysisData.sampleTransactions.existing.length,
                    newTransactions: result.added,
                    potentialDuplicates: result.duplicates,
                    overlapPeriod: {
                        start: transactions[0]?.date || new Date().toISOString(),
                        end: transactions[transactions.length - 1]?.date || new Date().toISOString()
                    }
                },
                sampleTransactions: {
                    new: transactions.slice(0, 5),
                    existing: importStatus.analysisData.sampleTransactions.existing,
                    duplicates: []
                }
            }
        });
        logger.info('Import completed', {
            accountId,
            uploadId,
            added: result.added,
            duplicates: result.duplicates
        });
    }
    catch (error) {
        logger.error('Error processing import', { error });
        const importError = error;
        // Update import status with error
        await exports.importService.updateImportStatus({
            accountId: event.accountId,
            uploadId: event.uploadId,
            status: 'FAILED',
            analysisData: {
                fileStats: {
                    transactionCount: 0,
                    dateRange: { start: new Date().toISOString(), end: new Date().toISOString() }
                },
                overlapStats: {
                    existingTransactions: 0,
                    newTransactions: 0,
                    potentialDuplicates: 0,
                    overlapPeriod: { start: new Date().toISOString(), end: new Date().toISOString() }
                },
                sampleTransactions: {
                    new: [],
                    existing: [],
                    duplicates: []
                }
            }
        });
        throw importError;
    }
};
exports.handler = handler;
async function processTransactions(params) {
    const result = {
        added: 0,
        duplicates: 0,
        errors: []
    };
    for (const transaction of params.transactions) {
        try {
            // Check for duplicates by date and amount
            const isDuplicate = params.existingTransactions.some(existing => existing.date === transaction.date &&
                existing.amount === transaction.amount);
            if (isDuplicate) {
                switch (params.duplicateHandling) {
                    case 'SKIP':
                        result.duplicates++;
                        continue;
                    case 'REPLACE':
                        await transactionService.replaceTransaction(params.accountId, transaction);
                        result.duplicates++;
                        break;
                    case 'MARK_DUPLICATE':
                        await transactionService.createTransaction(params.accountId, {
                            ...transaction,
                            isDuplicate: true
                        });
                        result.duplicates++;
                        break;
                }
            }
            else {
                await transactionService.createTransaction(params.accountId, transaction);
                result.added++;
            }
        }
        catch (error) {
            const err = error;
            logger.error('Error processing transaction', { error: err, transaction });
            result.errors.push(`Failed to process transaction: ${err.message}`);
        }
    }
    return result;
}
//# sourceMappingURL=process.js.map