import { S3 } from '../utils/s3';
import { DynamoDB } from '../utils/dynamo';
import { Logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/errors';
import { Lambda } from '../utils/lambda';
import { Transaction } from '../types/transaction';
import { config } from '../config';

interface ImportAnalysis {
  fileStats: {
    transactionCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  overlapStats: {
    existingTransactions: number;
    newTransactions: number;
    potentialDuplicates: number;
    overlapPeriod: {
      start: string;
      end: string;
    };
  };
  sampleTransactions: {
    new: Transaction[];
    existing: Transaction[];
    duplicates: {
      new: Transaction;
      existing: Transaction;
      similarity: number;
    }[];
  };
}

// Define the ExpressionAttributeNames type
interface ExpressionAttributeNames {
  '#status': string;
  '#updatedAt': string;
  '#analysisData': string;
  '#processingOptions': string;
}

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
export class ImportService {
  private s3: S3;
  private dynamo: DynamoDB;
  private logger: Logger;

  constructor() {
    this.s3 = new S3();
    this.dynamo = new DynamoDB();
    this.logger = new Logger('import-service');
  }

  /**
   * Initiate an import by creating an import record in the database with a pending status
   * @param params - The parameters for the import
   */
  async initiateImport(params: {
    userId: string;
    accountId: string;
    fileName: string;
    fileType: string;
    contentType: string;
  }) {
    const uploadId = uuid();
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
  private async createImportRecord(params: {
    uploadId: string;
    userId: string;
    accountId: string;
    fileName: string;
    status: string;
  }) {
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
      TableName: config.tables.imports,
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
  private generateS3Key(
    userId: string,
    accountId: string,
    uploadId: string,
    fileName: string
  ): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${userId}/${accountId}/${year}/${month}/original/${uploadId}_${fileName}`;
  }

  async analyzeImportFile(params: {
    bucket: string;
    key: string;
    accountId: string;
    existingTransactions: Transaction[];
  }): Promise<ImportAnalysis> {
    // Get file content
    const fileContent: string = await this.s3.getFileContent(params.bucket, params.key);
    
    // Parse transactions based on file type
    const parsedTransactions = await this.parseTransactions(fileContent);
    
    // Find date range
    const dateRange = this.calculateDateRange(parsedTransactions);
    
    // Find overlapping transactions
    const { 
      newTransactions,
      duplicates
    } = this.findDuplicates(parsedTransactions, params.existingTransactions);
    
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

  async updateImportStatus(params: {
    uploadId: string;
    accountId: string;
    status: string;
    analysisData?: ImportAnalysis;
    processingOptions?: {
      duplicateHandling: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
    };
  }) {
    const timestamp = new Date().toISOString();
    
    const updateExpression = ['#status = :status', '#updatedAt = :timestamp'];
    const expressionAttributeNames: ExpressionAttributeNames = {
      '#status': 'status',
      '#updatedAt': 'updatedAt',
      '#analysisData': 'analysisData',
      '#processingOptions': 'processingOptions'
    };
    const expressionAttributeValues: any = {
      ':status': params.status,
      ':timestamp': timestamp
    };

    if (params.analysisData) {
      updateExpression.push('#analysisData = :analysis');
      expressionAttributeNames['#analysisData'] = 'analysisData';
      expressionAttributeValues[':analysis'] = params.analysisData;
    }

    if (params.processingOptions) {
      updateExpression.push('#processingOptions = :options');
      expressionAttributeNames['#processingOptions'] = 'processingOptions';
      expressionAttributeValues[':options'] = params.processingOptions;
    }
    
    const updateParams = {
      TableName: config.tables.imports,
      Key: {
        PK: `ACCOUNT#${params.accountId}`,
        SK: `IMPORT#${params.uploadId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    await this.dynamo.update(updateParams);
  }

  parseS3Key(key: string): { userId: string; accountId: string; uploadId: string } {
    const parts = key.split('/');
    const fileName = parts[parts.length - 1];
    const [uploadId] = fileName.split('_');
    
    return {
      userId: parts[0],
      accountId: parts[1],
      uploadId
    };
  }

  public async parseTransactions(fileContent: string): Promise<Transaction[]> {
    try {
      const lines = fileContent.trim().split('\n');
      if (lines.length < 2) {
        throw new ValidationError('File must contain header and at least one transaction');
      }

      const headers = lines[0].toLowerCase().split(',');
      const requiredFields = ['date', 'description', 'amount'] as const;
      
      // Validate headers
      const headerIndexes = {
        date: headers.indexOf('date'),
        description: headers.indexOf('description'),
        amount: headers.indexOf('amount')
      } as const;

      for (const field of requiredFields) {
        if (headerIndexes[field] === -1) {
          throw new ValidationError(`Missing required field: ${field}`);
        }
      }

      return lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          
          if (values.length !== headers.length) {
            throw new ValidationError(
              `Invalid CSV format at line ${index + 2}: expected ${headers.length} values but got ${values.length}`
            );
          }

          const amount = parseFloat(values[headerIndexes.amount]);
          if (isNaN(amount)) {
            throw new ValidationError(
              `Invalid amount at line ${index + 2}: ${values[headerIndexes.amount]}`
            );
          }

          const dateStr = values[headerIndexes.date];
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            throw new ValidationError(
              `Invalid date at line ${index + 2}: ${dateStr}`
            );
          }

          const transaction: Transaction = {
            id: uuid(),
            date: date.toISOString().split('T')[0],
            description: values[headerIndexes.description],
            amount,
            importId: uuid(),
            createdAt: new Date().toISOString()
          };

          return transaction;
        });
    } catch (error) {
      this.logger.error('Error parsing transactions', { error });
      throw error;
    }
  }

  private calculateDateRange(transactions: Transaction[]): { start: string; end: string } {
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

  private findDuplicates(newTransactions: Transaction[], existingTransactions: Transaction[]) {
    const duplicates: Array<{ new: Transaction; existing: Transaction; similarity: number }> = [];
    const uniqueTransactions: Transaction[] = [];

    for (const newTxn of newTransactions) {
      const potentialDuplicates = existingTransactions.filter(existingTxn => 
        this.isPotentialDuplicate(newTxn, existingTxn)
      );

      if (potentialDuplicates.length > 0) {
        duplicates.push({
          new: newTxn,
          existing: potentialDuplicates[0],
          similarity: this.calculateSimilarity(newTxn, potentialDuplicates[0])
        });
      } else {
        uniqueTransactions.push(newTxn);
      }
    }

    return {
      newTransactions: uniqueTransactions,
      duplicates
    };
  }

  private isPotentialDuplicate(txn1: Transaction, txn2: Transaction): boolean {
    return txn1.date === txn2.date && 
           txn1.amount === txn2.amount &&
           Math.abs(new Date(txn1.date).getTime() - new Date(txn2.date).getTime()) < 86400000;
  }

  private calculateSimilarity(txn1: Transaction, txn2: Transaction): number {
    // Simple similarity score based on date, amount, and description
    let score = 0;
    
    // Exact date match
    if (txn1.date === txn2.date) score += 0.4;
    
    // Exact amount match
    if (txn1.amount === txn2.amount) score += 0.4;
    
    // Description similarity
    const description1 = txn1.description.toLowerCase();
    const description2 = txn2.description.toLowerCase();
    if (description1 === description2) score += 0.2;
    
    return score;
  }

  private getSampleTransactions(newTransactions: Transaction[], duplicates: any[]) {
    return {
      new: newTransactions.slice(0, 5),
      existing: [],
      duplicates: duplicates.slice(0, 5)
    };
  }

  async getImportStatus(accountId: string, uploadId: string) {
    const result = await this.dynamo.get({
      TableName: config.tables.imports,
      Key: {
        PK: `ACCOUNT#${accountId}`,
        SK: `IMPORT#${uploadId}`
      }
    });
    
    if (!result.Item) {
      throw new ValidationError('Import not found');
    }
    
    return result.Item;
  }

  /**
   * Confirm the import has been reviewed and is ready to be processed
   * @param params - The parameters for the import
   */
  async confirmImport(params: {
    accountId: string;
    uploadId: string;
    userConfirmations: {
      accountVerified: boolean;
      dateRangeVerified: boolean;
      samplesReviewed: boolean;
    };
    duplicateHandling: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
  }) {
    // Verify all confirmations are true
    const allConfirmed = Object.values(params.userConfirmations).every(v => v === true);
    if (!allConfirmed) {
      throw new ValidationError('All confirmations must be accepted');
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
  private async triggerProcessing(params: {
    accountId: string;
    uploadId: string;
    duplicateHandling: string;
  }) {
    const lambda = new Lambda();
    
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
  async getImportFile(accountId: string, uploadId: string): Promise<string> {
    const importRecord = await this.getImportStatus(accountId, uploadId);
    const key = this.generateS3Key(
      importRecord.userId,
      accountId,
      uploadId,
      importRecord.fileName
    );
    
    const bucketName = process.env.IMPORT_BUCKET || 'housef2-imports';
    return await this.s3.getFileContent(bucketName, key);
  }

  /**
   * Update the account assignment for an import
   * @param params - The parameters for updating the account assignment
   */
  async updateAccountAssignment(params: {
    uploadId: string;
    currentAccountId: string;
    newAccountId: string;
    userId: string;
  }) {
    const { uploadId, currentAccountId, newAccountId, userId } = params;
    
    // First, get the current import status to verify it exists
    const importRecord = await this.getImportStatus(currentAccountId, uploadId);
    
    if (!importRecord) {
      throw new ValidationError(`Import with ID ${uploadId} not found for account ${currentAccountId}`);
    }
    
    // Only allow reassignment if the import is in certain states
    const allowedStates = ['PENDING', 'ANALYZED', 'FAILED'];
    if (!allowedStates.includes(importRecord.status)) {
      throw new ValidationError(`Cannot reassign import in ${importRecord.status} state. Import must be in one of these states: ${allowedStates.join(', ')}`);
    }
    
    // Create a new record with the new account ID
    await this.dynamo.update({
      TableName: config.tables.imports,
      Key: {
        PK: `IMPORT#${uploadId}`,
        SK: `METADATA#${uploadId}`
      },
      UpdateExpression: 'SET #accountId = :newAccountId, #updatedAt = :updatedAt, #updatedBy = :updatedBy, #history = list_append(if_not_exists(#history, :emptyList), :historyEntry)',
      ExpressionAttributeNames: {
        '#accountId': 'AccountId',
        '#updatedAt': 'UpdatedAt',
        '#updatedBy': 'UpdatedBy',
        '#history': 'AccountHistory'
      },
      ExpressionAttributeValues: {
        ':newAccountId': newAccountId,
        ':updatedAt': new Date().toISOString(),
        ':updatedBy': userId,
        ':emptyList': [],
        ':historyEntry': [{
          timestamp: new Date().toISOString(),
          previousAccountId: currentAccountId,
          newAccountId: newAccountId,
          updatedBy: userId
        }]
      }
    });
    
    this.logger.info('Updated account assignment', {
      uploadId,
      previousAccountId: currentAccountId,
      newAccountId,
      updatedBy: userId
    });
    
    return {
      uploadId,
      accountId: newAccountId,
      status: importRecord.status,
      message: `Import successfully reassigned from account ${currentAccountId} to account ${newAccountId}`
    };
  }

  /**
   * Delete an import record and its associated file
   * @param accountId - The account ID
   * @param uploadId - The upload ID
   */
  async deleteImport(accountId: string, uploadId: string): Promise<void> {
    // Get the import record to find the S3 key
    const importRecord = await this.getImportStatus(accountId, uploadId);
    
    // Delete the import record from DynamoDB
    await this.dynamo.delete({
      TableName: config.tables.imports,
      Key: {
        PK: `ACCOUNT#${accountId}`,
        SK: `IMPORT#${uploadId}`
      }
    });
    
    // If the import has a file in S3, delete it
    if (importRecord.s3Key) {
      try {
        await this.s3.deleteFile(config.buckets.imports, importRecord.s3Key);
      } catch (error) {
        this.logger.warn('Failed to delete import file from S3', { error, accountId, uploadId });
        // Continue even if S3 deletion fails
      }
    }
    
    this.logger.info('Import deleted', { accountId, uploadId });
  }
} 