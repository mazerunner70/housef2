export interface ImportConfirmation {
  uploadId: string;
  accountId: string;
  userConfirmations: Array<{
    transactionId: string;
    action: 'KEEP' | 'SKIP' | 'UPDATE';
  }>;
  duplicateHandling: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
}

export interface ImportAnalysis {
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
    new: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
    }>;
    existing: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
    }>;
    duplicates: Array<{
      new: {
        id: string;
        date: string;
        description: string;
        amount: number;
      };
      existing: {
        id: string;
        date: string;
        description: string;
        amount: number;
      };
      similarity: number;
    }>;
  };
}

export interface ImportListItem {
  uploadId: string;
  fileName: string;
  fileType: string;
  uploadTime: string;
  status: 'PENDING' | 'ANALYZING' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  matchedAccountId?: string;
  matchedAccountName?: string;
  fileStats?: {
    transactionCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  error?: string;
} 