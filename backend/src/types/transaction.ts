export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  importId?: string;
  createdAt: string;
  isDuplicate?: boolean;
}

export type TransactionField = keyof Transaction; 