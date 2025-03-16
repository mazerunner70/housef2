import { API } from './api';
import { ImportAnalysis, ImportConfirmation } from '../types/import';
import { Transaction } from '../types/transaction';

export interface InitiateImportResponse {
  uploadId: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface ImportStatus {
  uploadId: string;
  accountId: string;
  status: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
  analysisData?: any;
  error?: {
    code: string;
    message: string;
  };
}

export interface AccountAssignment {
  uploadId: string;
  accountId: string;
  status: string;
  message: string;
}

export interface AccountHistory {
  timestamp: string;
  previousAccountId: string;
  newAccountId: string;
  updatedBy: string;
}

export interface TransactionImportResult {
  totalTransactions: number;
  importedTransactions: number;
  skippedTransactions: number;
  duplicateTransactions: number;
  transactions: Transaction[];
}

export interface ParsedTransactionFile {
  transactions: Transaction[];
  fileName: string;
  fileType: string;
}

class ImportService {
  private api: API;

  constructor() {
    this.api = new API();
  }

  /**
   * Get all imports for an account
   * @param accountId - The account ID
   */
  async getImports(accountId: string): Promise<ImportStatus[]> {
    const response = await this.api.get(`/accounts/${accountId}/imports`);
    return response.data;
  }

  /**
   * Get the status of an import
   * @param accountId - The account ID
   * @param uploadId - The upload ID
   */
  async getImportStatus(accountId: string, uploadId: string): Promise<ImportStatus> {
    const response = await this.api.get(`/accounts/${accountId}/imports/${uploadId}`);
    return response.data;
  }

  /**
   * Initiate a new import
   * @param accountId - The account ID
   * @param file - The file to upload
   */
  async initiateImport(accountId: string, file: File): Promise<{ uploadUrl: string; uploadId: string }> {
    const response = await this.api.post(`/accounts/${accountId}/imports`, {
      fileName: file.name,
      fileType: file.type,
      contentType: file.type
    });
    
    return response.data;
  }

  /**
   * Upload a file to the pre-signed URL
   * @param uploadUrl - The pre-signed URL
   * @param file - The file to upload
   */
  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
  }

  /**
   * Delete an import
   * @param accountId - The account ID
   * @param uploadId - The upload ID
   */
  async deleteImport(accountId: string, uploadId: string): Promise<void> {
    await this.api.delete(`/accounts/${accountId}/imports/${uploadId}`);
  }

  /**
   * Confirm an import for processing
   * @param params - The confirmation parameters
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
    notes?: string;
  }): Promise<void> {
    await this.api.post(`/accounts/${params.accountId}/imports/${params.uploadId}/confirm`, {
      userConfirmations: params.userConfirmations,
      duplicateHandling: params.duplicateHandling,
      notes: params.notes
    });
  }

  /**
   * Reassign an import to a different account
   * @param uploadId - The upload ID
   * @param currentAccountId - The current account ID
   * @param newAccountId - The new account ID
   */
  async reassignImport(
    uploadId: string,
    currentAccountId: string,
    newAccountId: string
  ): Promise<AccountAssignment> {
    const response = await this.api.post(`/accounts/${currentAccountId}/imports/${uploadId}/reassign`, {
      currentAccountId,
      newAccountId
    });
    
    return response.data;
  }

  /**
   * Parse a CSV file into transactions
   * @param file - The CSV file to parse
   * @param accountId - The account ID to assign transactions to
   * @param options - Parsing options
   */
  async parseTransactionFile(
    file: File, 
    accountId: string,
    options?: {
      dateFormat?: string;
      columnMapping?: Record<string, string>;
      skipHeaderRow?: boolean;
    }
  ): Promise<ParsedTransactionFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (!content) {
            reject(new Error('Failed to read file content'));
            return;
          }
          
          // Parse CSV content
          const transactions = this.parseCSV(content, accountId, options);
          
          resolve({
            transactions,
            fileName: file.name,
            fileType: file.type
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Parse CSV content into transactions
   * @param content - The CSV content
   * @param accountId - The account ID
   * @param options - Parsing options
   */
  private parseCSV(
    content: string, 
    accountId: string,
    options?: {
      dateFormat?: string;
      columnMapping?: Record<string, string>;
      skipHeaderRow?: boolean;
    }
  ): Transaction[] {
    // Split content into lines
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    // Skip header row if specified
    const dataLines = options?.skipHeaderRow ? lines.slice(1) : lines;
    
    // Default column mapping
    const columnMap = options?.columnMapping || {
      date: '0',
      description: '1',
      amount: '2',
      category: '3'
    };
    
    // Parse each line into a transaction
    return dataLines.map((line, index) => {
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      // Extract values based on column mapping
      const dateIndex = parseInt(columnMap.date);
      const descriptionIndex = parseInt(columnMap.description);
      const amountIndex = parseInt(columnMap.amount);
      const categoryIndex = parseInt(columnMap.category);
      
      const dateStr = columns[dateIndex];
      const description = columns[descriptionIndex] || 'Unknown';
      const amountStr = columns[amountIndex];
      const category = columns[categoryIndex];
      
      // Parse date
      let date: Date;
      try {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          // Try alternative formats
          const parts = dateStr.split(/[\/\-\.]/);
          if (parts.length === 3) {
            // Assume MM/DD/YYYY format
            date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        }
      } catch (e) {
        date = new Date();
      }
      
      // Parse amount
      let amount = 0;
      try {
        // Remove currency symbols and commas
        const cleanAmount = amountStr.replace(/[$,]/g, '');
        amount = parseFloat(cleanAmount);
      } catch (e) {
        amount = 0;
      }
      
      // Determine transaction type based on amount
      const type = amount >= 0 ? 'income' : 'expense';
      
      // Create transaction object
      return {
        id: `import-${index}-${Date.now()}`,
        accountId: accountId,
        date,
        amount: Math.abs(amount),
        description,
        category,
        type
      };
    });
  }
  
  /**
   * Import transactions directly (without server-side processing)
   * @param accountId - The account ID
   * @param transactions - The transactions to import
   * @param options - Import options
   */
  async importTransactions(
    accountId: string,
    transactions: Transaction[],
    options?: {
      duplicateHandling?: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
    }
  ): Promise<TransactionImportResult> {
    // In a real app, this would call the API
    // const response = await this.api.post(`/accounts/${accountId}/transactions/batch`, {
    //   transactions,
    //   options
    // });
    
    // For now, simulate a successful import
    return {
      totalTransactions: transactions.length,
      importedTransactions: transactions.length,
      skippedTransactions: 0,
      duplicateTransactions: 0,
      transactions
    };
  }

  async pollForAnalysis(accountId: string, uploadId: string): Promise<ImportAnalysis> {
    const maxAttempts = 30;
    const delayMs = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getImportStatus(accountId, uploadId);
      
      if (status.status === 'READY') {
        return status.analysisData;
      }
      
      if (status.status === 'FAILED') {
        throw new Error(status.error?.message || 'Import analysis failed');
      }

      if (status.status === 'WRONG_ACCOUNT_DETECTED') {
        throw new Error('Wrong account detected');
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
      attempts++;
    }

    throw new Error('Timeout waiting for analysis');
  }
}

export const importService = new ImportService(); 