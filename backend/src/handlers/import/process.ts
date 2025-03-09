import { Handler } from 'aws-lambda';
import { Logger } from '../../utils/logger';
import { ImportService } from '../../services/import';
import { TransactionService } from '../../services/transaction';

import { Transaction } from '../../types/transaction';

export interface ProcessEvent {
  accountId: string;
  uploadId: string;
  duplicateHandling: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
}

interface ImportError extends Error {
  code?: string;
}

const logger = new Logger('import-process-handler');
export const importService = new ImportService();
const transactionService = new TransactionService();


export const handler: Handler<ProcessEvent> = async (event) => {
  try {
    const { accountId, uploadId, duplicateHandling } = event;
    
    logger.info('Processing import', { accountId, uploadId });
    
    // Get import status and analysis
    const importStatus = await importService.getImportStatus(accountId, uploadId);
    console.log('importStatus', importStatus);
    
 
    // Get file content
    const fileContent: string = await importService.getImportFile(accountId, uploadId);
    
    // Parse transactions
    const transactions: Transaction[] = await importService.parseTransactions(fileContent);
    
    // Process transactions based on duplicate handling strategy
    const result = await processTransactions({
      accountId,
      transactions,
      duplicateHandling,
      existingTransactions: importStatus.analysisData.sampleTransactions.existing
    });
    
    // Update import status
    await importService.updateImportStatus({
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
    
  } catch (error) {
    logger.error('Error processing import', { error });
    
    const importError = error as ImportError;
    
    // Update import status with error
    await importService.updateImportStatus({
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
      // Check for duplicates by date and amount
      const isDuplicate = params.existingTransactions.some(
        existing => 
          existing.date === transaction.date && 
          existing.amount === transaction.amount
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
      const err = error as Error;
      logger.error('Error processing transaction', { error: err, transaction });
      result.errors.push(`Failed to process transaction: ${err.message}`);
    }
  }
  
  return result;
} 