import { API } from './api';
import { ImportAnalysis, ImportConfirmation } from '../types/import';

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
   * Confirm an import
   * @param accountId - The account ID
   * @param uploadId - The upload ID
   * @param confirmations - The user confirmations
   * @param duplicateHandling - How to handle duplicates
   */
  async confirmImport(
    accountId: string, 
    uploadId: string, 
    confirmations: {
      accountVerified: boolean;
      dateRangeVerified: boolean;
      samplesReviewed: boolean;
    },
    duplicateHandling: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE'
  ): Promise<void> {
    await this.api.post(`/accounts/${accountId}/imports/${uploadId}/confirm`, {
      userConfirmations: confirmations,
      duplicateHandling
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