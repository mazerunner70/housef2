import { S3 } from '../utils/s3';
import { DynamoDB } from '../utils/dynamo';
import { Logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';
import { ValidationError } from '../utils/validation';
import { Lambda } from '../utils/lambda';

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

export class ImportService {
  private s3: S3;
  private dynamo: DynamoDB;
  private logger: Logger;

  constructor() {
    this.s3 = new S3();
    this.dynamo = new DynamoDB();
    this.logger = new Logger('import-service');
  }

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
      TableName: 'housef2-imports',
      Item: item
    });
  }

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
    const fileContent = await this.s3.getFileContent(params.bucket, params.key);
    
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
  }) {
    const timestamp = new Date().toISOString();
    
    const updateParams = {
      TableName: 'housef2-imports',
      Key: {
        PK: `ACCOUNT#${params.accountId}`,
        SK: `IMPORT#${params.uploadId}`
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :timestamp, analysisData = :analysis',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': params.status,
        ':timestamp': timestamp,
        ':analysis': params.analysisData
      }
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

  private async parseTransactions(fileContent: string): Promise<Transaction[]> {
    // This would be implemented with different parsers based on file type
    // For now, assuming CSV format
    const lines = fileContent.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        return {
          date: values[0],
          amount: parseFloat(values[1]),
          description: values[2],
          // Add other fields based on file format
        };
      });
  }

  private calculateDateRange(transactions: Transaction[]): { start: string; end: string } {
    const dates = transactions.map(t => new Date(t.date));
    return {
      start: new Date(Math.min(...dates)).toISOString(),
      end: new Date(Math.max(...dates)).toISOString()
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
    const params = {
      TableName: 'housef2-imports',
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

  async getImportFile(accountId: string, uploadId: string): Promise<string> {
    const importRecord = await this.getImportStatus(accountId, uploadId);
    const key = this.generateS3Key(
      importRecord.userId,
      accountId,
      uploadId,
      importRecord.fileName
    );
    
    return await this.s3.getFileContent(this.s3.bucket, key);
  }
} 