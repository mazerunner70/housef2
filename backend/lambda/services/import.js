"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const s3_1 = require("../utils/s3");
const dynamo_1 = require("../utils/dynamo");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
const errors_1 = require("../utils/errors");
const lambda_1 = require("../utils/lambda");
const config_1 = require("../config");
/**
 * ImportService
 *
 * This service is responsible for initiating an import, analyzing the file, and updating the import status.
 * It also handles the processing of the import.
 *
 * Outline usage:
 *
 * 1. Initiate import
 * 2. Analyze import file
 * 3. Update import status
 * 4. Trigger processing
 *
 */
class ImportService {
    constructor() {
        this.s3 = new s3_1.S3();
        this.dynamo = new dynamo_1.DynamoDB();
        this.logger = new logger_1.Logger('import-service');
    }
    /**
     * Initiate an import by creating an import record in the database with a pending status
     * @param params - The parameters for the import
     */
    async initiateImport(params) {
        const uploadId = (0, uuid_1.v4)();
        const { userId, accountId, fileName } = params;
        // Create import record
        await this.createImportRecord({
            uploadId,
            userId,
            accountId,
            fileName,
            status: 'PENDING'
        });
        // Generate pre-signed URL
        const key = this.generateS3Key(userId, accountId, uploadId, fileName);
        const uploadUrl = await this.s3.getSignedUploadUrl({
            key,
            contentType: params.contentType,
            expiresIn: 300 // 5 minutes
        });
        return {
            uploadId,
            uploadUrl,
            expiresIn: 300
        };
    }
    /**
     * Create an import record in the database with a pending status
     * @param params - The parameters for the import
     */
    async createImportRecord(params) {
        const timestamp = new Date().toISOString();
        const item = {
            PK: `ACCOUNT#${params.accountId}`,
            SK: `IMPORT#${params.uploadId}`,
            GSI1PK: `USER#${params.userId}`,
            GSI1SK: `IMPORT#${timestamp}`,
            uploadId: params.uploadId,
            fileName: params.fileName,
            status: params.status,
            createdAt: timestamp,
            updatedAt: timestamp
        };
        await this.dynamo.put({
            TableName: config_1.config.tables.imports,
            Item: item
        });
    }
    /**
     * Generate an S3 key for the import file based on the user ID, account ID, upload ID, and file name
     * @param userId - The user ID
     * @param accountId - The account ID
     * @param uploadId - The upload ID
     * @param fileName - The file name
     * @returns The S3 key
     */
    generateS3Key(userId, accountId, uploadId, fileName) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${userId}/${accountId}/${year}/${month}/original/${uploadId}_${fileName}`;
    }
    async analyzeImportFile(params) {
        // Get file content
        const fileContent = await this.s3.getFileContent(params.bucket, params.key);
        // Parse transactions based on file type
        const parsedTransactions = await this.parseTransactions(fileContent);
        // Find date range
        const dateRange = this.calculateDateRange(parsedTransactions);
        // Find overlapping transactions
        const { newTransactions, duplicates } = this.findDuplicates(parsedTransactions, params.existingTransactions);
        // Get sample transactions
        const samples = this.getSampleTransactions(newTransactions, duplicates);
        return {
            fileStats: {
                transactionCount: parsedTransactions.length,
                dateRange
            },
            overlapStats: {
                existingTransactions: params.existingTransactions.length,
                newTransactions: newTransactions.length,
                potentialDuplicates: duplicates.length,
                overlapPeriod: dateRange
            },
            sampleTransactions: samples
        };
    }
    async updateImportStatus(params) {
        const timestamp = new Date().toISOString();
        const updateExpression = ['SET #status = :status', 'updatedAt = :timestamp'];
        const expressionAttributeNames = { '#status': 'status' };
        const expressionAttributeValues = {
            ':status': params.status,
            ':timestamp': timestamp
        };
        if (params.analysisData) {
            updateExpression.push('analysisData = :analysis');
            expressionAttributeValues[':analysis'] = params.analysisData;
        }
        if (params.processingOptions) {
            updateExpression.push('processingOptions = :options');
            expressionAttributeValues[':options'] = params.processingOptions;
        }
        const updateParams = {
            TableName: config_1.config.tables.imports,
            Key: {
                PK: `ACCOUNT#${params.accountId}`,
                SK: `IMPORT#${params.uploadId}`
            },
            UpdateExpression: updateExpression.join(', '),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        };
        await this.dynamo.update(updateParams);
    }
    parseS3Key(key) {
        const parts = key.split('/');
        const fileName = parts[parts.length - 1];
        const [uploadId] = fileName.split('_');
        return {
            userId: parts[0],
            accountId: parts[1],
            uploadId
        };
    }
    async parseTransactions(fileContent) {
        try {
            const lines = fileContent.trim().split('\n');
            if (lines.length < 2) {
                throw new errors_1.ValidationError('File must contain header and at least one transaction');
            }
            const headers = lines[0].toLowerCase().split(',');
            const requiredFields = ['date', 'description', 'amount'];
            // Validate headers
            const headerIndexes = {
                date: headers.indexOf('date'),
                description: headers.indexOf('description'),
                amount: headers.indexOf('amount')
            };
            for (const field of requiredFields) {
                if (headerIndexes[field] === -1) {
                    throw new errors_1.ValidationError(`Missing required field: ${field}`);
                }
            }
            return lines.slice(1)
                .filter(line => line.trim())
                .map((line, index) => {
                const values = line.split(',').map(v => v.trim());
                if (values.length !== headers.length) {
                    throw new errors_1.ValidationError(`Invalid CSV format at line ${index + 2}: expected ${headers.length} values but got ${values.length}`);
                }
                const amount = parseFloat(values[headerIndexes.amount]);
                if (isNaN(amount)) {
                    throw new errors_1.ValidationError(`Invalid amount at line ${index + 2}: ${values[headerIndexes.amount]}`);
                }
                const dateStr = values[headerIndexes.date];
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    throw new errors_1.ValidationError(`Invalid date at line ${index + 2}: ${dateStr}`);
                }
                const transaction = {
                    id: (0, uuid_1.v4)(),
                    date: date.toISOString().split('T')[0],
                    description: values[headerIndexes.description],
                    amount,
                    importId: (0, uuid_1.v4)(),
                    createdAt: new Date().toISOString()
                };
                return transaction;
            });
        }
        catch (error) {
            this.logger.error('Error parsing transactions', { error });
            throw error;
        }
    }
    calculateDateRange(transactions) {
        if (!transactions.length) {
            return {
                start: new Date().toISOString(),
                end: new Date().toISOString()
            };
        }
        const dates = transactions.map(t => new Date(t.date));
        return {
            start: new Date(Math.min(...dates.map(d => d.getTime()))).toISOString(),
            end: new Date(Math.max(...dates.map(d => d.getTime()))).toISOString()
        };
    }
    findDuplicates(newTransactions, existingTransactions) {
        const duplicates = [];
        const uniqueTransactions = [];
        for (const newTxn of newTransactions) {
            const potentialDuplicates = existingTransactions.filter(existingTxn => this.isPotentialDuplicate(newTxn, existingTxn));
            if (potentialDuplicates.length > 0) {
                duplicates.push({
                    new: newTxn,
                    existing: potentialDuplicates[0],
                    similarity: this.calculateSimilarity(newTxn, potentialDuplicates[0])
                });
            }
            else {
                uniqueTransactions.push(newTxn);
            }
        }
        return {
            newTransactions: uniqueTransactions,
            duplicates
        };
    }
    isPotentialDuplicate(txn1, txn2) {
        return txn1.date === txn2.date &&
            txn1.amount === txn2.amount &&
            Math.abs(new Date(txn1.date).getTime() - new Date(txn2.date).getTime()) < 86400000;
    }
    calculateSimilarity(txn1, txn2) {
        // Simple similarity score based on date, amount, and description
        let score = 0;
        // Exact date match
        if (txn1.date === txn2.date)
            score += 0.4;
        // Exact amount match
        if (txn1.amount === txn2.amount)
            score += 0.4;
        // Description similarity
        const description1 = txn1.description.toLowerCase();
        const description2 = txn2.description.toLowerCase();
        if (description1 === description2)
            score += 0.2;
        return score;
    }
    getSampleTransactions(newTransactions, duplicates) {
        return {
            new: newTransactions.slice(0, 5),
            existing: [],
            duplicates: duplicates.slice(0, 5)
        };
    }
    async getImportStatus(accountId, uploadId) {
        const params = {
            TableName: config_1.config.tables.imports,
            Key: {
                PK: `ACCOUNT#${accountId}`,
                SK: `IMPORT#${uploadId}`
            }
        };
        const result = await this.dynamo.get(params);
        if (!result.Item) {
            throw new Error('Import not found');
        }
        return result.Item;
    }
    /**
     * Confirm the import has been reviewed and is ready to be processed
     * @param params - The parameters for the import
     */
    async confirmImport(params) {
        // Verify all confirmations are true
        const allConfirmed = Object.values(params.userConfirmations).every(v => v === true);
        if (!allConfirmed) {
            throw new errors_1.ValidationError('All confirmations must be accepted');
        }
        // Update status to processing
        await this.updateImportStatus({
            accountId: params.accountId,
            uploadId: params.uploadId,
            status: 'PROCESSING',
            processingOptions: {
                duplicateHandling: params.duplicateHandling
            }
        });
        // Trigger processing lambda
        await this.triggerProcessing(params);
    }
    /**
     * Trigger the processing lambda
     * @param params - The parameters for the processing lambda to take the file and create transactions
     */
    async triggerProcessing(params) {
        const lambda = new lambda_1.Lambda();
        await lambda.invoke({
            FunctionName: 'housef2-import-processor',
            InvocationType: 'Event',
            Payload: JSON.stringify({
                accountId: params.accountId,
                uploadId: params.uploadId,
                duplicateHandling: params.duplicateHandling
            })
        });
    }
    /**
     * Get the import file from S3
     * @param accountId - The account ID
     * @param uploadId - The upload ID
     * @returns The import file as a string
     */
    async getImportFile(accountId, uploadId) {
        const importRecord = await this.getImportStatus(accountId, uploadId);
        const key = this.generateS3Key(importRecord.userId, accountId, uploadId, importRecord.fileName);
        const bucketName = process.env.IMPORT_BUCKET || 'housef2-imports';
        return await this.s3.getFileContent(bucketName, key);
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=import.js.map