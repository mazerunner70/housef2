import { API } from './api';
import { ImportAnalysis, ImportListItem, ImportConfirmation, WrongAccountResponse } from '../types/import';
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

export class ImportService {
  private api: API;

  constructor(api: API) {
    this.api = api;
  }

  /**
   * Get all imports for the current user
   */
  async getImports(): Promise<ImportListItem[]> {
    try {
      const response = await this.api.get('imports');
      return response.data;
    } catch (error) {
      console.error('Error fetching imports:', error);
      return [];
    }
  }

  /**
   * Get import analysis for a specific import
   */
  async getImportAnalysis(uploadId: string): Promise<ImportAnalysis> {
    try {
      const response = await this.api.get(`imports/${uploadId}/analysis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching import analysis:', error);
      throw error;
    }
  }

  /**
   * Get pre-signed URL for file upload
   */
  async getUploadUrl(fileName: string, fileType: string): Promise<{ uploadUrl: string; uploadId: string }> {
    try {
      const response = await this.api.post('imports/upload-url', {
        fileName,
        fileType,
        contentType: this.getContentType(fileType)
      });
      return response.data;
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw error;
    }
  }

  /**
   * Confirm import and start processing
   */
  async confirmImport(confirmation: ImportConfirmation): Promise<void> {
    try {
      await this.api.post(`imports/${confirmation.uploadId}/confirm`, confirmation);
    } catch (error) {
      console.error('Error confirming import:', error);
      throw error;
    }
  }

  /**
   * Handle wrong account detection
   */
  async handleWrongAccount(uploadId: string, action: { action: string; newAccountId?: string; confirmation?: string; reason?: string }): Promise<void> {
    try {
      await this.api.post(`imports/${uploadId}/wrong-account`, action);
    } catch (error) {
      console.error('Error handling wrong account:', error);
      throw error;
    }
  }

  /**
   * Delete an import
   */
  async deleteImport(uploadId: string): Promise<void> {
    try {
      await this.api.delete(`imports/${uploadId}`);
    } catch (error) {
      console.error('Error deleting import:', error);
      throw error;
    }
  }

  /**
   * Get content type for file type
   */
  getContentType(fileType: string): string {
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
   * Get all imports for an account
   * @param accountId - The account ID
   */
  async getImportsForAccount(accountId: string): Promise<ImportStatus[]> {
    try {
      // Ensure accountId is properly encoded if it's an email address
      const encodedAccountId = encodeURIComponent(accountId);
      console.log(`Fetching imports for account: ${encodedAccountId}`);
      
      // Make the API call with explicit path parameter
      const response = await this.api.get(`accounts/${encodedAccountId}/imports`);
      
      // Log the full request details for debugging
      console.log('Request details:', {
        accountId,
        encodedAccountId,
        path: `accounts/${encodedAccountId}/imports`
      });
      
      // Handle different response formats
      if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      // If response format is not recognized, log and return empty array
      console.warn('Unrecognized response format when fetching imports:', response);
      return [];
      
    } catch (error) {
      // Handle authentication errors
      if (error instanceof Error) {
        if (error.message.includes('403')) {
          console.error('Authentication error while fetching imports. Please check login status.');
        } else {
          console.error('Error fetching imports:', error);
        }
      }
      
      // Return empty array on error
      return [];
    }
  }

  /**
   * Get import status for a specific import
   * @param accountId - The account ID
   * @param uploadId - The upload ID
   */
  async getImportStatus(accountId: string, uploadId: string): Promise<ImportStatus> {
    try {
      console.log(`Getting import status for account: ${accountId}, upload: ${uploadId}`);
      
      // Use encodeURIComponent to handle special characters in account ID (like email addresses)
      const encodedAccountId = encodeURIComponent(accountId);
      
      const response = await this.api.get(`accounts/${encodedAccountId}/imports/${uploadId}`);
      return response;
    } catch (error) {
      console.error('Error getting import status:', error);
      throw error;
    }
  }

  /**
   * Initiate a new import upload
   * @param accountId - The account ID
   * @param file - The file to upload
   */
  async initiateImport(accountId: string, file: File): Promise<{ uploadUrl: string; uploadId: string }> {
    console.log(`Initiating import for account: ${accountId}, file: ${file.name}`);
    
    // Use encodeURIComponent to handle special characters in account ID
    const encodedAccountId = encodeURIComponent(accountId);
    
    const response = await this.api.post(`/accounts/${encodedAccountId}/imports`, {
      fileName: file.name,
      contentType: file.type
    });
    
    return {
      uploadId: response.uploadId,
      uploadUrl: response.uploadUrl
    };
  }

  /**
   * Upload a file to the provided URL
   * @param uploadUrl - The presigned upload URL
   * @param file - The file to upload
   */
  async uploadFile(uploadUrl: string, file: File): Promise<void> {
    console.log(`Uploading file to: ${uploadUrl}`);
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
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
    console.log(`Reassigning import ${uploadId} from ${currentAccountId} to ${newAccountId}`);
    const response = await this.api.post(`/imports/${uploadId}/reassign`, {
      currentAccountId,
      newAccountId
    });
    return response;
  }

  /**
   * Parse a transaction file for preview
   * @param file - The file to parse
   * @param accountId - The account ID
   * @param options - Optional parsing options
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
    console.log(`Parsing transaction file: ${file.name}`);
    
    // For client-side parsing, read the file content
    const fileContent = await this.readFileContent(file);
    
    // For CSV files, use the parseCSV function
    if (file.name.toLowerCase().endsWith('.csv')) {
      const transactions = this.parseCSV(fileContent, accountId, options);
      return {
        transactions,
        fileName: file.name,
        fileType: 'csv'
      };
    }
    
    // For other formats, call the API
    const formData = new FormData();
    formData.append('file', file);
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }
    
    // Use encodeURIComponent to handle special characters in account ID
    const encodedAccountId = encodeURIComponent(accountId);
    
    const response = await this.api.post(`/accounts/${encodedAccountId}/parse-file`, formData);
    return response;
  }
  
  /**
   * Read file content as text
   * @param file - The file to read
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  /**
   * Parse CSV content
   * @param content - The CSV content
   * @param accountId - The account ID
   * @param options - Optional parsing options
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
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    // Skip header row if specified
    const dataLines = options?.skipHeaderRow ? lines.slice(1) : lines;
    
    // Parse each line
    return dataLines.map((line, index) => {
      const columns = line.split(',').map(col => col.trim());
      
      // Use column mapping if provided, otherwise use default mapping
      let date = columns[0];
      let description = columns[1];
      let amount = parseFloat(columns[2]);
      
      if (options?.columnMapping) {
        date = columns[options.columnMapping.date ? parseInt(options.columnMapping.date) : 0];
        description = columns[options.columnMapping.description ? parseInt(options.columnMapping.description) : 1];
        amount = parseFloat(columns[options.columnMapping.amount ? parseInt(options.columnMapping.amount) : 2]);
      }
      
      // Create transaction object
      return {
        id: `temp-${index}`,
        accountId,
        date,
        description,
        amount,
        type: amount < 0 ? 'expense' : 'income',
        category: '',
        tags: []
      };
    });
  }
  
  /**
   * Import transactions into an account
   * @param accountId - The account ID
   * @param transactions - The transactions to import
   * @param options - Optional import options
   */
  async importTransactions(
    accountId: string,
    transactions: Transaction[],
    options?: {
      duplicateHandling?: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
    }
  ): Promise<TransactionImportResult> {
    console.log(`Importing ${transactions.length} transactions to account: ${accountId}`);
    
    // Use encodeURIComponent to handle special characters in account ID
    const encodedAccountId = encodeURIComponent(accountId);
    
    const response = await this.api.post(`/accounts/${encodedAccountId}/transactions/import`, {
      transactions,
      options
    });
    
    return response;
  }
  
  /**
   * Poll for import analysis result
   * @param accountId - The account ID
   * @param uploadId - The upload ID
   */
  async pollForAnalysis(accountId: string, uploadId: string): Promise<ImportAnalysis> {
    console.log(`Polling for analysis result: ${accountId}, ${uploadId}`);
    
    // Use encodeURIComponent to handle special characters in account ID
    const encodedAccountId = encodeURIComponent(accountId);
    
    // Retry up to 10 times with exponential backoff
    let retries = 0;
    const maxRetries = 10;
    const baseDelay = 2000;
    
    while (retries < maxRetries) {
      const status = await this.getImportStatus(encodedAccountId, uploadId);
      
      if (status.status === 'ANALYSIS_COMPLETE') {
        return status.analysisData;
      }
      
      if (status.status === 'FAILED') {
        throw new Error(status.error?.message || 'Import analysis failed');
      }
      
      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(1.5, retries);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
    
    throw new Error('Import analysis timed out');
  }
}

export const importService = new ImportService(new API()); 