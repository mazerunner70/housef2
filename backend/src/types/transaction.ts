export interface Transaction {
  date: string;
  amount: number;
  description: string;
  category?: string;
  notes?: string;
  tags?: string[];
  isDuplicate?: boolean;
  accountSpecificData?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
} 