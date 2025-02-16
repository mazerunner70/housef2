# DynamoDB Table Design Decisions

## Overview
This document outlines the DynamoDB table structure for the House Finances application. The design follows DynamoDB best practices for single-table design while maintaining query efficiency.

## Main Table Design

### Table Name: `housef2-main`

#### Primary Keys
- Partition Key: `PK` (string)
- Sort Key: `SK` (string)

#### Key Patterns

1. **User Records**
   ```
   PK: USER#{userId}
   SK: METADATA
   ```

2. **Account Records**
   ```
   PK: USER#{userId}
   SK: ACCOUNT#{accountId}
   ```

3. **Transaction Records**
   ```
   PK: ACCOUNT#{accountId}
   SK: TXN#{timestamp}#{hash}
   ```

### Global Secondary Indexes (GSIs)

1. **UserTransactions-GSI**
   - PK: `USER#{userId}`
   - SK: `TXN#{timestamp}#{hash}`
   - Purpose: Query all transactions across user's accounts

2. **CategoryIndex-GSI**
   - PK: `USER#{userId}`
   - SK: `CATEGORY#{category}#TXN#{timestamp}`
   - Purpose: Query transactions by category

### Example Item Structures

#### User Item
```json
{
  "PK": "USER#u123",
  "SK": "METADATA",
  "userId": "u123",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-03-14T00:00:00Z",
  "settings": {
    "defaultCurrency": "USD",
    "timezone": "America/New_York"
  }
}
```

#### Account Item
```json
{
  "PK": "USER#u123",
  "SK": "ACCOUNT#acc123",
  "accountId": "acc123",
  "accountName": "Main Checking",
  "providerName": "Bank of Example",
  "accountType": "CHECKING",
  "balance": 150000,
  "currency": "USD",
  "lastUpdated": "2024-03-14T00:00:00Z",
  "isActive": true
}
```

#### Transaction Item
```json
{
  "PK": "ACCOUNT#acc123",
  "SK": "TXN#2024-03-14T15:30:00Z#a1b2c3d4",
  "GSI1-PK": "USER#u123",
  "GSI1-SK": "TXN#2024-03-14T15:30:00Z#a1b2c3d4",
  "GSI2-PK": "USER#u123",
  "GSI2-SK": "CATEGORY#groceries#TXN#2024-03-14T15:30:00Z",
  "transactionId": "acc123:2024-03-14T15:30:00Z:a1b2c3d4",
  "amount": -5099,
  "description": "GROCERY STORE 123",
  "category": "groceries",
  "date": "2024-03-14",
  "accountSpecificData": {
    "checkNumber": "1234",
    "referenceNumber": "REF123456"
  }
}
```

## Design Considerations

### 1. Single-Table Design
- All related data stored in one table
- Reduces cross-table queries
- Simplifies backup and maintenance

### 2. Access Patterns
Supports efficient queries for:
- All accounts for a user
- All transactions for an account
- All transactions for a user
- Transactions by category
- Transactions within a date range
- Account balances and metadata

### 3. Data Organization
- Hierarchical structure (User -> Account -> Transaction)
- Consistent naming conventions for keys
- GSIs support common query patterns

### 4. Capacity Planning
- On-demand capacity mode 

### 5. Item Size Limits
- Keep items under 400KB DynamoDB limit
- Large text fields stored compressed
- S3 for storing original import files

### 6. Cost Optimization
- Minimize GSIs to reduce costs
- Use sparse indexes where possible
- Implement TTL for temporary data

### 7. Security
- Use IAM roles for access control
- Encrypt sensitive data before storage
- Implement attribute-based access control

### 8. Backup Strategy
- Enable point-in-time recovery
- Regular backups for disaster recovery
- Consider cross-region replication for high availability 

### Table Names
```typescript
interface TableNames {
  main: "housef2-main";              // Core application data
  importStatus: "housef2-imports";    // Import tracking
}
``` 