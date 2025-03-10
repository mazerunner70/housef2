# Data Strategy Design Decisions

## Overview
This document outlines the data retention, backup, and recovery strategy for the House Finances application. The strategy ensures data durability through redundant storage and enables full system recovery in case of data corruption.

## Data Storage Layers

### Primary Storage
```typescript
interface StorageLocations {
  dynamoDB: {
    tables: {
      main: "housef2-main";        // Transactions, accounts, users
      imports: "housef2-imports";   // Import tracking
    };
    backupType: "CONTINUOUS";       // Point-in-time recovery enabled
  };
  
  s3: {
    buckets: {
      transactionFiles: "housef2-transaction-files";  // Original uploads
      backups: "housef2-backups";                     // DynamoDB backups
    };
    versioning: "ENABLED";
  };
}
```

## Transaction File Retention

### Original Import Files
```typescript
interface TransactionFileStorage {
  location: "housef2-transaction-files";
  structure: {
    userId: string;
    accountId: string;
    year: string;
    month: string;
    filename: string;
  };
  metadata: {
    importId: string;
    uploadDate: string;
    processingStatus: string;
    transactionCount: number;
    fileHash: string;
  };
}
```

### Retention Policy
- All original transaction files retained indefinitely
- Files stored with immutable flag enabled
- Version control enabled for accidental deletion protection
- Files organized by user/account/year/month

### File Organization
```
housef2-transaction-files/
├── {userId}/
│   ├── {accountId}/
│   │   ├── {year}/
│   │   │   ├── {month}/
│   │   │   │   ├── original/
│   │   │   │   │   └── {importId}_{filename}
│   │   │   │   └── metadata/
│   │   │   │       └── {importId}.json
```

## DynamoDB Backup Strategy

### Incremental Backups
```typescript
interface BackupConfig {
  pointInTimeRecovery: {
    enabled: true;
    windowInDays: 35;
  };
  
  incrementalBackups: {
    frequency: "DAILY";
    retentionPeriod: "FOREVER";
    format: "DYNAMODB_JSON";
  };
  
  backupLocation: {
    bucket: "housef2-backups";
    prefix: "dynamodb/incremental";
  };
}
```

### Backup Organization
```
housef2-backups/
├── dynamodb/
│   ├── incremental/
│   │   ├── {year}/
│   │   │   ├── {month}/
│   │   │   │   ├── {day}/
│   │   │   │   │   ├── main-table/
│   │   │   │   │   │   └── {timestamp}.json
│   │   │   │   │   └── imports-table/
│   │   │   │   │       └── {timestamp}.json
│   ├── full/
│   │   └── {timestamp}/
│   │       ├── main-table.json
│   │       └── imports-table.json
```

## Recovery Procedures

### Data Corruption Recovery
```typescript
interface RecoveryProcess {
  steps: [
    "identify_corruption_scope",
    "select_recovery_point",
    "restore_dynamodb_backup",
    "verify_data_integrity",
    "reprocess_recent_imports"
  ];
  
  verificationChecks: {
    transactionCounts: boolean;
    accountBalances: boolean;
    userAccounts: boolean;
    importHistory: boolean;
  };
}
```

### Recovery Time Objectives
```typescript
interface RecoveryObjectives {
  RTO: "4 hours";     // Recovery Time Objective
  RPO: "24 hours";    // Recovery Point Objective
  
  priorities: [
    "user_access",
    "account_data",
    "recent_transactions",
    "historical_data"
  ];
}
```

## Data Integrity

### Validation Processes
```typescript
interface DataValidation {
  daily: {
    balanceReconciliation: boolean;
    transactionCounts: boolean;
    importConsistency: boolean;
  };
  
  weekly: {
    fullDataIntegrity: boolean;
    backupVerification: boolean;
    storageConsistency: boolean;
  };
}
```

### Integrity Checks
- Transaction totals match account balances
- Import records match stored files
- User accounts link to valid data
- No orphaned records
- Backup completeness verification

## Cost Management

### Storage Optimization
```typescript
interface StorageOptimization {
  compression: {
    transactionFiles: true;
    backupFiles: true;
    compressionFormat: "GZIP";
  };
  
  lifecycle: {
    transactionFiles: "INTELLIGENT_TIERING";
    backups: {
      current: "STANDARD";
      older: "GLACIER";
      transitionDays: 90;
    };
  };
}
```

### Monitoring
```typescript
interface StorageMonitoring {
  metrics: {
    totalStorageSize: "Daily";
    storageGrowthRate: "Weekly";
    backupSize: "Daily";
    restoreTests: "Monthly";
  };
  
  alerts: {
    storageThreshold: "80%";
    backupFailure: "IMMEDIATE";
    integrityCheck: "DAILY";
  };
}
```

## User Data Isolation

### Data Partitioning
```typescript
interface DataPartitioning {
  // Primary key strategy for all tables
  keyStrategy: {
    partition: {
      key: "userId";  // Ensures data isolation at storage level
      type: "STRING";
    };
    sort: {
      key: "resourceId";  // e.g., accountId, transactionId
      type: "STRING";
    };
  };
  
  // Global Secondary Indexes
  indexes: {
    byResource: {
      partition: "resourceType";
      sort: "userId#resourceId";
    };
    byDate: {
      partition: "userId";
      sort: "createdAt";
    };
  };
}

// Access patterns for user data
interface UserDataAccess {
  // Required fields for all resources
  mandatoryFields: {
    userId: string;        // Owner of the resource
    createdBy: string;     // User who created the resource
    createdAt: string;     // Timestamp of creation
    lastModifiedBy: string; // Last user to modify
    lastModifiedAt: string; // Last modification timestamp
  };
  
  // Access control lists for shared resources
  accessControl: {
    owner: string;         // Primary owner
    sharedWith?: string[]; // Other users with access
    permissions: {         // Granular permissions
      read: string[];
      write: string[];
      admin: string[];
    };
  };
}
```

### Query Patterns
```typescript
interface QueryPatterns {
  // Single user queries
  userQueries: {
    getOwnedResources: {
      keyCondition: "userId = :userId";
      filterExpression?: string;
    };
    getSharedResources: {
      indexName: "bySharing";
      keyCondition: "sharedWith.contains(:userId)";
    };
  };
  
  // Batch operations
  batchQueries: {
    validateOwnership: boolean;  // Check ownership before batch ops
    maxBatchSize: 25;           // Limit batch size for control
  };
}
```

### Data Access Layer
```typescript
interface DataAccessLayer {
  // Protected resource definitions
  protectedResources: {
    accounts: {
      prefix: "ACC#";
      permissions: ['read', 'write', 'admin'] as const;
      requiredFields: ['userId', 'accountId'];
    };
    transactions: {
      prefix: "TXN#";
      permissions: ['read', 'write'] as const;
      requiredFields: ['userId', 'accountId', 'transactionId'];
    };
    settings: {
      prefix: "SET#";
      permissions: ['admin'] as const;
      requiredFields: ['userId', 'settingId'];
    };
    imports: {
      prefix: "IMP#";
      permissions: ['write'] as const;
      requiredFields: ['userId', 'importId', 'accountId'];
    };
  };

  // Middleware for all data operations
  middleware: {
    preQuery: [
      "validateUser",
      "appendUserContext",
      "checkPermissions"
    ];
    postQuery: [
      "filterUserData",
      "logAccess",
      "checkIntegrity"
    ];
  };
  
  // Error handling for access violations
  errorHandling: {
    unauthorized: {
      logLevel: "WARN";
      action: "REJECT";
      notification: boolean;
    };
    integrity: {
      logLevel: "ERROR";
      action: "ROLLBACK";
      notification: boolean;
    };
  };
}
```

### Implementation Examples
```typescript
// Example DynamoDB query with user isolation
const getUserAccounts = async (userId: string): Promise<Account[]> => {
  const params = {
    TableName: "housef2-main",
    KeyConditionExpression: "userId = :uid AND begins_with(resourceId, 'ACC#')",
    ExpressionAttributeValues: {
      ":uid": userId
    }
  };
  return dynamoDB.query(params);
};

// Example transaction query with access control
const getTransaction = async (
  userId: string,
  transactionId: string
): Promise<Transaction | null> => {
  const params = {
    TableName: "housef2-main",
    KeyConditionExpression: "userId = :uid AND resourceId = :tid",
    FilterExpression: "OR sharedWith.contains(:uid)",
    ExpressionAttributeValues: {
      ":uid": userId,
      ":tid": `TXN#${transactionId}`
    }
  };
  return dynamoDB.query(params);
};
```

### Backup Isolation
```typescript
interface BackupIsolation {
  // Ensure backups maintain user isolation
  backupStrategy: {
    perUserBackups: boolean;     // Separate backup files per user
    encryptionContext: {
      userId: string;            // User-specific encryption
      timestamp: string;
    };
  };
  
  // Recovery maintains isolation
  recoveryStrategy: {
    validateUserAccess: boolean;  // Check permissions during restore
    maintainOwnership: boolean;   // Preserve original ownership
    auditRecovery: boolean;      // Log all recovery operations
  };
}
```

## Implementation Guidelines

1. Backup Automation
   - Automated daily incremental backups
   - Monthly full backups
   - Automated integrity checks
   - Backup success notifications

2. Recovery Testing
   - Monthly recovery drills
   - Documented recovery procedures
   - Recovery time measurements
   - Data integrity verification

3. Storage Management
   - Regular storage audits
   - Compression monitoring
   - Cost optimization reviews
   - Access pattern analysis 