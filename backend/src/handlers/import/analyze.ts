import { S3Handler } from 'aws-lambda';
import { Logger } from '../../utils/logger';
import { ImportService } from '../../services/import';
import { TransactionService } from '../../services/transaction';

const logger = new Logger('import-analyze-handler');
const importService = new ImportService();
const transactionService = new TransactionService();

export const handler: S3Handler = async (event) => {
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
  } catch (error) {
    logger.error('Error analyzing import', { error });
    throw error;
  }
}; 