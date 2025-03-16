import { API } from './api';
import { Transaction } from '../types/transaction';

export interface TransactionFilter {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  category?: string;
  type?: 'income' | 'expense';
  searchTerm?: string;
}

export interface TransactionCreateRequest {
  accountId: string;
  date: Date;
  amount: number;
  description: string;
  category?: string;
  notes?: string;
}

export interface TransactionUpdateRequest {
  id: string;
  accountId: string;
  date?: Date;
  amount?: number;
  description?: string;
  category?: string;
  notes?: string;
}

class TransactionService {
  private api: API;

  constructor() {
    this.api = new API();
  }

  /**
   * Get all transactions for an account with optional filters
   * @param accountId - The account ID
   * @param filters - Optional filters
   */
  async getTransactions(accountId: string, filters?: TransactionFilter): Promise<Transaction[]> {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (filters) {
      if (filters.startDate) {
        queryParams.append('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        queryParams.append('endDate', filters.endDate.toISOString());
      }
      if (filters.minAmount !== undefined) {
        queryParams.append('minAmount', filters.minAmount.toString());
      }
      if (filters.maxAmount !== undefined) {
        queryParams.append('maxAmount', filters.maxAmount.toString());
      }
      if (filters.category) {
        queryParams.append('category', filters.category);
      }
      if (filters.type) {
        queryParams.append('type', filters.type);
      }
      if (filters.searchTerm) {
        queryParams.append('search', filters.searchTerm);
      }
    }
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await this.api.get(`/accounts/${accountId}/transactions${queryString}`);
    
    return response.data;
  }

  /**
   * Get a single transaction by ID
   * @param accountId - The account ID
   * @param transactionId - The transaction ID
   */
  async getTransaction(accountId: string, transactionId: string): Promise<Transaction> {
    const response = await this.api.get(`/accounts/${accountId}/transactions/${transactionId}`);
    return response.data;
  }

  /**
   * Create a new transaction
   * @param transaction - The transaction to create
   */
  async createTransaction(transaction: TransactionCreateRequest): Promise<Transaction> {
    const response = await this.api.post(`/accounts/${transaction.accountId}/transactions`, transaction);
    return response.data;
  }

  /**
   * Update an existing transaction
   * @param transaction - The transaction to update
   */
  async updateTransaction(transaction: TransactionUpdateRequest): Promise<Transaction> {
    const response = await this.api.put(
      `/accounts/${transaction.accountId}/transactions/${transaction.id}`, 
      transaction
    );
    return response.data;
  }

  /**
   * Delete a transaction
   * @param accountId - The account ID
   * @param transactionId - The transaction ID
   */
  async deleteTransaction(accountId: string, transactionId: string): Promise<void> {
    await this.api.delete(`/accounts/${accountId}/transactions/${transactionId}`);
  }

  /**
   * Get transaction categories
   * @param accountId - The account ID
   */
  async getCategories(accountId: string): Promise<string[]> {
    const response = await this.api.get(`/accounts/${accountId}/categories`);
    return response.data;
  }
}

export const transactionService = new TransactionService(); 