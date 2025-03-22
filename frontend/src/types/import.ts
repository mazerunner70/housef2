import { Transaction } from './transaction';

export interface ImportAnalysis {
  uploadId: string;
  accountId: string;
  status: "ANALYZING" | "READY" | "ERROR";
  
  // File Statistics
  fileStats: {
    fileName: string;
    transactionCount: number;
    dateRange: {
      start: string;
      end: string;
    }
  };
  
  // Overlap Analysis
  overlapStats: {
    existingTransactions: number;
    newTransactions: number;
    potentialDuplicates: number;
    overlapPeriod: {
      start: string;
      end: string;
    }
  };
  
  // Sample Transactions
  sampleTransactions: {
    new: Transaction[];        // 3-5 examples
    existing: Transaction[];   // 3-5 from same period
    duplicates: {
      new: Transaction;
      existing: Transaction;
      similarity: number;
    }[];
  };
  
  errors?: string[];
}

export interface ImportListItem {
  uploadId: string;
  fileName: string;
  fileType: string;
  uploadTime: string;
  status: "PENDING" | "ANALYZING" | "READY" | "ERROR";
  matchedAccountId?: string;
  matchedAccountName?: string;
  fileStats?: {
    transactionCount: number;
    dateRange: {
      start: string;
      end: string;
    }
  };
  error?: {
    code: string;
    message: string;
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
  duplicateHandling: "SKIP" | "REPLACE" | "MARK_DUPLICATE";
  notes?: string;
}

export interface WrongAccountResponse {
  isWrongAccount: boolean;
  confidence: number;  // 0-100
  reasons: string[];
  suggestedAccounts: {
    accountId: string;
    accountName: string;
    institution: string;
    matchConfidence: number;
    lastTransactionDate: string;
    recentTransactionSamples: Transaction[];
  }[];
}

export type ImportRedirectAction = 
  | { action: "REASSIGN"; newAccountId: string }
  | { action: "CONTINUE_ANYWAY"; confirmation: string }
  | { action: "REJECT"; reason: string };

export interface WrongAccountDialog {
  uploadId: string;
  originalAccountId: string;
  analysisResults: {
    patternMismatch: boolean;
    institutionMismatch: boolean;
    balanceMismatch: boolean;
    descriptionFormatMismatch: boolean;
  };
  suggestedAccounts: Array<{
    accountId: string;
    accountName: string;
    matchReason: string[];
    confidence: number;
  }>;
  userAction: ImportRedirectAction;
} 