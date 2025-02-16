import { handler } from '../../../handlers/import/process';
import { ImportService } from '../../../services/import';
import { TransactionService } from '../../../services/transaction';
import { AccountService } from '../../../services/account';

// Mock services
jest.mock('../../../services/import');
jest.mock('../../../services/transaction');
jest.mock('../../../services/account');

describe('Import Process Handler', () => {
  const mockEvent = {
    accountId: 'test-account',
    uploadId: 'test-upload',
    duplicateHandling: 'SKIP' as const
  };

  const mockImportStatus = {
    accountId: 'test-account',
    uploadId: 'test-upload',
    status: 'ANALYZING',
    analysisData: {
      sampleTransactions: {
        existing: []
      }
    }
  };

  const mockFileContent = 'date,description,amount\n2024-01-01,Test Transaction,100.00';
  const mockTransactions = [
    {
      id: 'test-transaction',
      date: '2024-01-01',
      description: 'Test Transaction',
      amount: 100.00
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (ImportService as jest.Mock).mockImplementation(() => ({
      getImportStatus: jest.fn().mockResolvedValue(mockImportStatus),
      getImportFile: jest.fn().mockResolvedValue(mockFileContent),
      parseTransactions: jest.fn().mockResolvedValue(mockTransactions),
      updateImportStatus: jest.fn().mockResolvedValue({}),
      isPotentialDuplicate: jest.fn().mockReturnValue(false)
    }));

    (TransactionService as jest.Mock).mockImplementation(() => ({
      createTransaction: jest.fn().mockResolvedValue({}),
      replaceTransaction: jest.fn().mockResolvedValue({})
    }));

    (AccountService as jest.Mock).mockImplementation(() => ({
      updateBalance: jest.fn().mockResolvedValue({})
    }));
  });

  it('should process import successfully with no duplicates', async () => {
    const result = await handler(mockEvent);
    
    expect(ImportService.prototype.getImportStatus).toHaveBeenCalledWith(
      mockEvent.accountId,
      mockEvent.uploadId
    );
    expect(ImportService.prototype.getImportFile).toHaveBeenCalledWith(
      mockEvent.accountId,
      mockEvent.uploadId
    );
    expect(ImportService.prototype.parseTransactions).toHaveBeenCalledWith(mockFileContent);
    expect(TransactionService.prototype.createTransaction).toHaveBeenCalledTimes(1);
    expect(AccountService.prototype.updateBalance).toHaveBeenCalledWith(mockEvent.accountId);
    expect(ImportService.prototype.updateImportStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: mockEvent.accountId,
        uploadId: mockEvent.uploadId,
        status: 'COMPLETED'
      })
    );
  });

  it('should handle duplicate transactions with SKIP strategy', async () => {
    (ImportService.prototype.isPotentialDuplicate as jest.Mock).mockReturnValue(true);
    
    await handler(mockEvent);
    
    expect(TransactionService.prototype.createTransaction).not.toHaveBeenCalled();
    expect(ImportService.prototype.updateImportStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'COMPLETED',
        summary: expect.objectContaining({
          duplicatesHandled: 1,
          transactionsAdded: 0
        })
      })
    );
  });

  it('should handle duplicate transactions with REPLACE strategy', async () => {
    const replaceEvent = { ...mockEvent, duplicateHandling: 'REPLACE' as const };
    (ImportService.prototype.isPotentialDuplicate as jest.Mock).mockReturnValue(true);
    
    await handler(replaceEvent);
    
    expect(TransactionService.prototype.replaceTransaction).toHaveBeenCalledTimes(1);
    expect(ImportService.prototype.updateImportStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'COMPLETED',
        summary: expect.objectContaining({
          duplicatesHandled: 1,
          transactionsAdded: 0
        })
      })
    );
  });

  it('should handle duplicate transactions with MARK_DUPLICATE strategy', async () => {
    const markDuplicateEvent = { ...mockEvent, duplicateHandling: 'MARK_DUPLICATE' as const };
    (ImportService.prototype.isPotentialDuplicate as jest.Mock).mockReturnValue(true);
    
    await handler(markDuplicateEvent);
    
    expect(TransactionService.prototype.createTransaction).toHaveBeenCalledWith(
      markDuplicateEvent.accountId,
      expect.objectContaining({
        isDuplicate: true
      })
    );
  });

  it('should handle errors during processing', async () => {
    const error = new Error('Test error');
    (ImportService.prototype.parseTransactions as jest.Mock).mockRejectedValue(error);
    
    await expect(handler(mockEvent)).rejects.toThrow('Test error');
    
    expect(ImportService.prototype.updateImportStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        error: {
          message: 'Test error',
          code: 'PROCESSING_ERROR'
        }
      })
    );
  });
}); 