export interface Transaction {
    id: string;
    accountId: string;
    date: string | Date;
    amount: number;
    description: string;
    category?: string;
    type: 'income' | 'expense';
    notes?: string;
    tags?: string[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface TransactionCreateRequest {
    accountId: string;
    date: Date;
    amount: number;
    description: string;
    category?: string;
    type: 'income' | 'expense';
    notes?: string;
    tags?: string[];
}

export interface TransactionUpdateRequest {
    id: string;
    accountId?: string;
    date?: Date;
    amount?: number;
    description?: string;
    category?: string;
    type?: 'income' | 'expense';
    notes?: string;
    tags?: string[];
}

export interface TransactionFilterOptions {
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    categories?: string[];
    types?: ('income' | 'expense')[];
    searchTerm?: string;
}

export interface TransactionSortOptions {
    field: keyof Transaction;
    direction: 'asc' | 'desc';
}

export interface TransactionPaginationOptions {
    page: number;
    pageSize: number;
}

export interface TransactionListResponse {
    transactions: Transaction[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export type OrderBy = keyof Transaction;
export type Order = 'asc' | 'desc';

export interface TransactionImport {
    transactions: Transaction[];
    totalAmount: number;
    count: number;
} 