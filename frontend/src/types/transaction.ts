export interface Transaction {
    id: string;
    date: Date;
    amount: number;
    description: string;
    category?: string;
    type: 'income' | 'expense';
    notes?: string;
}

export interface TransactionImport {
    transactions: Transaction[];
    totalAmount: number;
    count: number;
} 