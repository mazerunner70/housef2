# Transaction Design Decisions

## Core Transaction Structure

Each transaction will have a synthetic primary key and core fields that are common across all account types, with the ability to store additional account-specific fields in a flexible format.

### Primary Key Strategy
- Synthetic primary key format: `{accountId}:{timestamp}:{hash}`
  - `accountId`: The account identifier
  - `timestamp`: Transaction timestamp in ISO format
  - `hash`: First 8 characters of SHA-256 hash of transaction details
  - Example: `acc_123:2024-03-14T15:30:00Z:a1b2c3d4`

### Core Transaction Fields
```typescript
interface CoreTransaction {
  // Primary Key
  transactionId: string;  // Synthetic primary key
  
  // Required Fields
  accountId: string;      // Reference to the account
  date: string;          // ISO date string
  amount: number;        // Transaction amount (negative for debits)
  description: string;   // Original transaction description
  
  // Optional Core Fields
  category?: string;     // Transaction category
  notes?: string;        // User notes
  tags?: string[];       // User-defined tags
  
  // Metadata
  importedAt: string;    // When the transaction was imported
  lastModified: string;  // Last modification timestamp
  
  // Extended Fields
  accountSpecificData?: Record<string, any>;  // Flexible storage for account-specific fields
}
```

### Account-Specific Extensions

#### Credit Card Transactions
```typescript
interface CreditCardSpecificData {
  merchantCategory?: string;    // MCC code
  cardLast4?: string;          // Last 4 digits of card
  foreignAmount?: number;      // Amount in foreign currency
  foreignCurrency?: string;    // Foreign currency code
  exchangeRate?: number;       // Exchange rate used
}
```

#### Bank Transactions
```typescript
interface BankSpecificData {
  checkNumber?: string;        // Check number if applicable
  referenceNumber?: string;    // Bank reference number
  counterpartyAccount?: string; // Other party's account info
  transactionType?: string;    // Bank-specific transaction type
}
```

#### Investment Transactions
```typescript
interface InvestmentSpecificData {
  security?: string;           // Security identifier
  units?: number;              // Number of units
  unitPrice?: number;          // Price per unit
  fees?: number;               // Transaction fees
  transactionType?: string;    // BUY, SELL, DIVIDEND, etc.
}
```

## Design Considerations

### 1. Data Consistency
- Core fields are strictly typed and required
- Account-specific fields are flexible but documented per account type
- All monetary amounts stored in smallest currency unit (e.g., cents)

### 2. Query Patterns
- Primary key design supports efficient queries by account
- Timestamp in key enables range queries for date periods
- Hash component ensures uniqueness for same-timestamp transactions

### 3. Data Import
- Parser configurations will map provider-specific fields to core fields
- Additional provider fields stored in accountSpecificData
- Original transaction data preserved for audit purposes

### 4. Data Export
- Core fields ensure consistent export format across accounts
- Account-specific data can be included in detailed exports
- Export format will be configurable per user needs

### 5. Storage Efficiency
- Only storing relevant account-specific fields
- Optional fields not included when null/undefined
- Compressed storage for large text fields

### 6. Migration Strategy
- Schema allows for adding new core fields without breaking existing records
- Account-specific data can evolve independently
- Version field can be added if needed for future schema migrations 