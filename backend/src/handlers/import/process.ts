import { Handler } from 'aws-lambda';
import { Logger } from '../../utils/logger';
import { ImportService } from '../../services/import';
import { TransactionService } from '../../services/transaction';
import { AccountService } from '../../services/account';

interface ProcessEvent {
  accountId: string;
  uploadId: string;
  duplicateHandling: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
}

const logger = new Logger('import-process-handler');
const importService = new ImportService();
const transactionService = new TransactionService();
const accountService = new AccountService();

export const handler: Handler<ProcessEvent> = async (event) => {
  try {
    const { accountId, uploadId, duplicateHandling } = event;
    
    logger.info('Processing import', { accountId, uploadId });
    
    // Get import status and analysis
    const importStatus = await importService.getImportStatus(accountId, uploadId);
    
    // Get file content
    const fileContent = await importService.getImportFile(accountId, uploadId);
    
    // Parse transactions
    const transactions = await importService.parseTransactions(fileContent);
    
    // Process transactions based on duplicate handling strategy
    const result = await processTransactions({
      accountId,
      transactions,
      duplicateHandling,
      existingTransactions: importStatus.analysisData.sampleTransactions.existing
    });
    
    // Update account balance
    await accountService.updateBalance(accountId);
    
    // Update import status
    await importService.updateImportStatus({
      accountId,
      uploadId,
      status: 'COMPLETED',
      summary: {
        transactionsAdded: result.added,
        duplicatesHandled: result.duplicates,
        errors: result.errors
      }
    });
    
    logger.info('Import completed', {
      accountId,
      uploadId,
      added: result.added,
      duplicates: result.duplicates
    });
    
  } catch (error) {
    logger.error('Error processing import', { error });
    
    // Update import status with error
    await importService.updateImportStatus({
      accountId: event.accountId,
      uploadId: event.uploadId,
      status: 'FAILED',
      error: {
        message: error.message,
        code: error.code || 'PROCESSING_ERROR'
      }
    });
    
    throw error;
  }
};

async function processTransactions(params: {
  accountId: string;
  transactions: Transaction[];
  duplicateHandling: string;
  existingTransactions: Transaction[];
}): Promise<{
  added: number;
  duplicates: number;
  errors: string[];
}> {
  const result = {
    added: 0,
    duplicates: 0,
    errors: [] as string[]
  };
  
  for (const transaction of params.transactions) {
    try {
      const isDuplicate = params.existingTransactions.some(
        existing => importService.isPotentialDuplicate(transaction, existing)
      );
      
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
      } else {
        await transactionService.createTransaction(params.accountId, transaction);
        result.added++;
      }
    } catch (error) {
      logger.error('Error processing transaction', { error, transaction });
      result.errors.push(`Failed to process transaction: ${error.message}`);
    }
  }
  
  return result;
} 