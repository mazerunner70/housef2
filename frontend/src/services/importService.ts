import { api } from '../utils/api';
import { ImportAnalysis, ImportConfirmation } from '../types/import';

export interface InitiateImportResponse {
  uploadId: string;
  uploadUrl: string;
  expiresIn: number;
}

class ImportService {
  async initiateImport(params: {
    accountId: string;
    fileName: string;
    fileType: string;
    contentType: string;
  }): Promise<InitiateImportResponse> {
    const response = await api.post('/import/initiate', params);
    return response.data;
  }

  async getImportStatus(accountId: string, uploadId: string) {
    const response = await api.get(`/import/${accountId}/${uploadId}/status`);
    return response.data;
  }

  async confirmImport(params: ImportConfirmation) {
    const response = await api.post('/import/confirm', params);
    return response.data;
  }

  async uploadFile(url: string, file: File) {
    await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });
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