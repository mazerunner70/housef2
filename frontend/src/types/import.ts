import { Transaction } from './transaction';

export type ImportStatus = 
  | 'PENDING'
  | 'ANALYZING'
  | 'READY'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'WRONG_ACCOUNT_DETECTED';

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
    new: Transaction[];
    existing: Transaction[];
    duplicates: {
      new: Transaction;
      existing: Transaction;
      similarity: number;
    }[];
  };
}

export interface ImportConfirmation {
  uploadId: string;
  accountId: string;
  userConfirmations: {
    accountVerified: boolean;
    dateRangeVerified: boolean;
    samplesReviewed: boolean;
  };
  duplicateHandling: 'SKIP' | 'REPLACE' | 'MARK_DUPLICATE';
  notes?: string;
}

export interface WrongAccountAnalysis {
  detectionConfidence: number;
  mismatchReasons: string[];
  suggestedAccountId: string;
  originalAccountId: string;
  suggestedAccounts: Array<{
    accountId: string;
    accountName: string;
    matchReason: string[];
    confidence: number;
  }>;
} 