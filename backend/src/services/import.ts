import { S3 } from 'aws-sdk';
import { DynamoDB } from 'aws-sdk';
import { Logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/errors';
import { Lambda } from '../utils/lambda';
import { Transaction } from '../types/transaction';
import { config } from '../config';
import type { ImportListItem, ImportConfirmation, ImportAnalysis } from '@shared/types/import';
import { getUserIdFromEvent } from '../utils/auth';

const s3 = new S3();
const dynamodb = new DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.IMPORT_BUCKET_NAME || 'housef2-imports';
const TABLE_NAME = process.env.IMPORT_TABLE_NAME || 'housef2-imports  ';

type ExpressionAttributeNames = { [key: string]: string };

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
  private logger: Logger;

  constructor() {
    this.logger = new Logger('import-service');
  }

  /**
   * Generate an S3 key for the import file
   */
  private generateS3Key(userId: string, accountId: string, uploadId: string, fileName: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${userId}/${accountId}/${year}/${month}/original/${uploadId}_${fileName}`;
  }

  /**
   * Get file content from S3
   */
  private async getFileContent(bucket: string, key: string): Promise<string> {
    const result = await s3.getObject({
      Bucket: bucket,
      Key: key
    }).promise();

    return result.Body?.toString('utf-8') || '';
  }

  /**
   * Get content type for file type
   */
  private getContentType(fileType: string): string {
    switch (fileType.toLowerCase()) {
      case 'csv':
        return 'text/csv';
      case 'ofx':
        return 'application/x-ofx';
      case 'qif':
        return 'application/x-qif';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Map DynamoDB item to ImportListItem
   */
  private mapDynamoItemToImportListItem(item: any): ImportListItem {
    return {
      uploadId: item.SK.replace('IMPORT#', ''),
      fileName: item.fileName,
      fileType: item.fileType,
      uploadTime: item.uploadTime,
      status: item.status,
      matchedAccountId: item.matchedAccountId,
      matchedAccountName: item.matchedAccountName,
      fileStats: item.fileStats,
      error: item.error
    };
  }

  /**
   * Initiate a new import
   */
  async initiateImport(userId: string, accountId: string, fileType: string): Promise<{ uploadId: string; uploadUrl: string }> {
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const key = `${userId}/${accountId}/pending/${uploadId}/original.${fileType}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: this.getContentType(fileType),
      Expires: 300 // URL expires in 5 minutes
    };

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

    // Create import record in DynamoDB
    const importItem = {
      PK: `USER#${userId}`,
      SK: `IMPORT#${uploadId}`,
      accountId,
      fileType,
      uploadTime: new Date().toISOString(),
      status: 'PENDING',
      s3Key: key
    };

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: importItem
    }).promise();

    return { uploadId, uploadUrl };
  }

  /**
   * Get all imports for the current user
   */
  async getImports(userId: string): Promise<ImportListItem[]> {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`
      }
    };

    const result = await dynamodb.query(params).promise();
    return (result.Items || []).map(item => this.mapDynamoItemToImportListItem(item));
  }

  /**
   * Get import analysis for a specific import
   */
  async getImportAnalysis(userId: string, uploadId: string): Promise<ImportAnalysis> {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `IMPORT#${uploadId}`
      }
    };

    const result = await dynamodb.get(params).promise();
    if (!result.Item) {
      throw new Error('Import not found');
    }

    return result.Item.analysisData;
  }

  /**
   * Get pre-signed URL for file upload
   */
  async getUploadUrl(userId: string, fileName: string, fileType: string): Promise<{ uploadUrl: string; uploadId: string }> {
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const key = `${userId}/pending/${uploadId}/original.${fileType}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: this.getContentType(fileType),
      Expires: 300 // URL expires in 5 minutes
    };

    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);

    // Create import record in DynamoDB
    const importItem = {
      PK: `USER#${userId}`,
      SK: `IMPORT#${uploadId}`,
      fileName,
      fileType,
      uploadTime: new Date().toISOString(),
      status: 'PENDING',
      s3Key: key
    };

    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: importItem
    }).promise();

    return { uploadUrl, uploadId };
  }

  /**
   * Confirm import and start processing
   */
  async confirmImport(userId: string, confirmation: ImportConfirmation): Promise<void> {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `IMPORT#${confirmation.uploadId}`
      },
      UpdateExpression: 'SET #status = :status, matchedAccountId = :accountId',
      ExpressionAttributeNames: {
        '#status': 'status'
      } as ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ':status': 'ANALYZING',
        ':accountId': confirmation.accountId
      }
    };

    await dynamodb.update(params).promise();
  }

  /**
   * Handle wrong account detection
   */
  async handleWrongAccount(userId: string, uploadId: string, action: { action: string; newAccountId?: string; confirmation?: string; reason?: string }): Promise<void> {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `IMPORT#${uploadId}`
      },
      UpdateExpression: 'SET #status = :status, matchedAccountId = :accountId, userAction = :action',
      ExpressionAttributeNames: {
        '#status': 'status'
      } as ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ':status': 'READY',
        ':accountId': action.newAccountId || null,
        ':action': action
      }
    };

    await dynamodb.update(params).promise();
  }

  /**
   * Delete an import
   */
  async deleteImport(userId: string, uploadId: string): Promise<void> {
    // Get the import to find the S3 key
    const getParams = {
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `IMPORT#${uploadId}`
      }
    };

    const result = await dynamodb.get(getParams).promise();
    if (!result.Item) {
      throw new Error('Import not found');
    }

    // Delete from S3
    if (result.Item.s3Key) {
      await s3.deleteObject({
        Bucket: BUCKET_NAME,
        Key: result.Item.s3Key
      }).promise();
    }

    // Delete from DynamoDB
    await dynamodb.delete({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `IMPORT#${uploadId}`
      }
    }).promise();
  }

  async analyzeImportFile(params: {
    bucket: string;
    key: string;
    accountId: string;
    existingTransactions: Transaction[];
  }): Promise<ImportAnalysis> {
    // Get file content
    const fileContent: string = await this.getFileContent(params.bucket, params.key);
    
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
    
    await dynamodb.update(updateParams).promise();
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
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${accountId}`,
        SK: `IMPORT#${uploadId}`
      }
    }).promise();
    
    if (!result.Item) {
      throw new ValidationError('Import not found');
    }
    
    return result.Item;
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
    return await this.getFileContent(bucketName, key);
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
    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `IMPORT#${uploadId}`
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
    }).promise();
    
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
} 