export interface AccountSummary {
  accountId: string;
  accountName: string;
  institution: string;
  accountType: string;
  balance: number;
  currency: string;
  lastUpdated: string;
  lastTransactionDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Account extends AccountSummary {
  userId: string;
} 