# API Design Decisions

## Overview
This document outlines the API structure for communication between the frontend and backend Lambda functions. All APIs are REST-based, secured through API Gateway with Cognito authentication.

## API Endpoints

### Account Management

#### List Accounts
```typescript
GET /api/accounts

Response {
  accounts: AccountSummary[];
  totalBalances: Record<string, number>; // By currency
  lastRefresh: string;
  alerts: Alert[];
}
```

#### Get Account Details
```typescript
GET /api/accounts/{accountId}

Response {
  account: {
    ...AccountSummary;
    transactionStats: {
      lastImportDate: string;
      totalTransactions: number;
      dateRange: {
        start: string;
        end: string;
      };
    };
    importHistory: {
      date: string;
      transactionCount: number;
      status: "SUCCESS" | "PARTIAL" | "FAILED";
    }[];
  };
}
```

#### Create Account
```typescript
POST /api/accounts

Request {
  accountName: string;
  institution: string;
  accountType: "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT";
  currency: string;
  notes?: string;
}

Response {
  accountId: string;
  // ... full account details
}
```

### Transaction Management

#### List Transactions
```typescript
GET /api/accounts/{accountId}/transactions

QueryParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "date" | "amount" | "description";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

Response {
  transactions: Transaction[];
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
  summary: {
    totalInflow: number;
    totalOutflow: number;
    byCategory: Record<string, number>;
  };
}
```

#### Update Transaction
```typescript
PATCH /api/accounts/{accountId}/transactions/{transactionId}

Request {
  category?: string;
  notes?: string;
  tags?: string[];
}

Response {
  transaction: Transaction;
}
```

### Import Process

#### Initiate Import
```typescript
POST /api/accounts/{accountId}/imports

Request {
  fileName: string;
  fileType: string;
  contentType: string;
}

Response {
  uploadId: string;
  uploadUrl: string;  // Pre-signed S3 URL
  expiresIn: number;
}
```

#### Get Import Status
```typescript
GET /api/accounts/{accountId}/imports/{uploadId}

Response {
  status: "ANALYZING" | "READY" | "ERROR";
  analysisData?: ImportAnalysis;
  errors?: string[];
}
```

#### Confirm Import
```typescript
POST /api/accounts/{accountId}/imports/{uploadId}/confirm

Request {
  userConfirmations: {
    accountVerified: boolean;
    dateRangeVerified: boolean;
    samplesReviewed: boolean;
  };
  duplicateHandling: "SKIP" | "REPLACE" | "MARK_DUPLICATE";
}

Response {
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  summary?: {
    transactionsAdded: number;
    duplicatesHandled: number;
    errors: string[];
  };
}
```

## API Conventions

### Request Headers
```typescript
interface RequestHeaders {
  Authorization: string;  // JWT from Cognito
  "Content-Type": "application/json";
  "X-Request-ID": string;  // Client-generated UUID
  "X-Client-Version": string;  // Frontend version
}
```

### Error Responses
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
  };
}
```

### Common Error Codes
- `AUTH_ERROR`: Authentication issues
- `INVALID_REQUEST`: Malformed request
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Performance Considerations

### Pagination
- Default page size: 50 items
- Maximum page size: 100 items
- Cursor-based pagination for large datasets
- Total count optional parameter

### Caching
```typescript
interface CacheConfig {
  routes: {
    "/api/accounts": { ttl: 300 };  // 5 minutes
    "/api/accounts/{id}": { ttl: 300 };
    "/api/transactions": { ttl: 3600 };  // 1 hour
  };
}
```

### Rate Limiting
```typescript
interface RateLimits {
  "GET /api/accounts": { rpm: 30 };
  "GET /api/transactions": { rpm: 60 };
  "POST /api/imports": { rpm: 5 };
}
```

## Security

### API Gateway Configuration
```typescript
interface ApiGatewayConfig {
  type: "REST";  // Using REST API type
  domain: string;
  stage: "production" | "development";
  authorization: "COGNITO";
  cors: {
    enabled: true;
    allowedOrigins: string[];
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"];
  };
}
```

### Data Validation
- JSON Schema validation
- Input sanitization
- Type checking
- Size limits

## Monitoring

### API Metrics
- Request latency
- Error rates
- Cache hit rates
- Lambda execution times
- API Gateway metrics

### Logging
```typescript
interface ApiLog {
  requestId: string;
  timestamp: string;
  endpoint: string;
  method: string;
  userId: string;
  duration: number;
  status: number;
  error?: string;
}
``` 