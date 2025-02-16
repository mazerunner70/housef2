# Logging and Monitoring Design Decisions

## Overview
This document outlines a pragmatic logging and monitoring strategy that provides sufficient visibility without overwhelming complexity or cost.

## Log Levels and Usage

### Log Level Definitions
```typescript
enum LogLevel {
  ERROR = 0,   // Application errors requiring attention
  WARN = 1,    // Potential issues or edge cases
  INFO = 2,    // Key business events
  DEBUG = 3    // Development/troubleshooting only
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  action: string;
  userId?: string;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}
```

### When to Log

#### ERROR Level
- Failed API calls
- Database operations failures
- Authentication failures
- Import process failures
- Unhandled exceptions

#### WARN Level
- Failed transaction imports
- API rate limit approaching
- Slow queries (> 1s)
- Authentication retries
- Data validation issues

#### INFO Level
- Successful imports
- Account creation/updates
- User sign-ins
- Batch operations completion
- Configuration changes

#### DEBUG Level
- Request/response details
- Function entry/exit
- State changes
- Cache operations
- Development diagnostics

## CloudWatch Configuration

### Log Groups
```typescript
interface LogGroups {
  api: "/aws/lambda/housef2-api";
  import: "/aws/lambda/housef2-import";
  auth: "/aws/cognito/housef2";
  frontend: "/aws/cloudfront/housef2-web";
}

const logRetention = 30;  // days
```

### Metrics
```typescript
interface CustomMetrics {
  // Import Process
  importSuccess: {
    namespace: "HouseF2/Imports";
    dimensions: ["AccountId"];
    unit: "Count";
  };
  
  // API Performance
  apiLatency: {
    namespace: "HouseF2/API";
    dimensions: ["Endpoint", "Method"];
    unit: "Milliseconds";
  };
  
  // User Activity
  activeUsers: {
    namespace: "HouseF2/Users";
    dimensions: ["TimeWindow"];
    unit: "Count";
  };
}
```

## Alarms

### Critical Alarms
```typescript
interface CriticalAlarms {
  apiErrors: {
    metric: "Errors";
    threshold: 5;
    period: 300;  // 5 minutes
    evaluationPeriods: 2;
  };
  
  importFailures: {
    metric: "ImportFailures";
    threshold: 3;
    period: 900;  // 15 minutes
    evaluationPeriods: 1;
  };
  
  authFailures: {
    metric: "AuthFailures";
    threshold: 10;
    period: 300;
    evaluationPeriods: 1;
  };
}
```

### Warning Alarms
```typescript
interface WarningAlarms {
  apiLatency: {
    metric: "Duration";
    threshold: 1000;  // 1 second
    period: 300;
    evaluationPeriods: 3;
  };
  
  lowStorageSpace: {
    metric: "FreeStorageSpace";
    threshold: 20;  // percentage
    period: 3600;   // 1 hour
    evaluationPeriods: 1;
  };
}
```

## Frontend Error Tracking

### Error Boundary
```typescript
interface ErrorBoundaryConfig {
  captureException: (error: Error) => void;
  fallback: React.ComponentType;
  ignoredErrors: string[];
}

// Key events to track
const trackableErrors = [
  'API_ERROR',
  'AUTH_ERROR',
  'RENDER_ERROR',
  'IMPORT_ERROR'
];
```

### Performance Monitoring
```typescript
interface PerformanceMetrics {
  pageLoad: {
    route: string;
    duration: number;
    timestamp: string;
  };
  
  apiCall: {
    endpoint: string;
    duration: number;
    success: boolean;
  };
  
  resourceTiming: {
    resource: string;
    duration: number;
    type: 'script' | 'style' | 'image';
  };
}
```

## Structured Logging

### Log Format
```typescript
interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  event: {
    category: 'API' | 'AUTH' | 'IMPORT' | 'USER';
    action: string;
    status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  };
  context: {
    userId?: string;
    accountId?: string;
    requestId?: string;
    environment: string;
  };
  data?: Record<string, any>;
  error?: {
    message: string;
    code: string;
    stack?: string;
  };
}
```

### Example Logger Implementation
```typescript
class Logger {
  log(entry: StructuredLog) {
    // Add common fields
    const enrichedEntry = {
      ...entry,
      service: process.env.SERVICE_NAME,
      version: process.env.APP_VERSION,
      timestamp: new Date().toISOString()
    };

    // Log to CloudWatch
    console.log(JSON.stringify(enrichedEntry));
    
    // Emit metrics if needed
    if (entry.level <= LogLevel.ERROR) {
      this.emitErrorMetric(entry);
    }
  }
}
```

## Cost Management

### Log Volume Control
- Sample debug logs in production
- Limit log retention to 30 days
- Aggregate similar errors
- Use log levels appropriately

### Metric Optimization
```typescript
interface MetricConfig {
  standardResolution: 60;    // 1-minute periods
  lowResolution: 300;        // 5-minute periods
  customMetricQuota: 10;     // Custom metrics limit
  alarmEvaluationCost: 0.10; // USD per alarm per month
}
```

## Development Support

### Local Logging
```typescript
// Development logger with pretty printing
const devLogger = {
  log: (entry: StructuredLog) => {
    const color = LOG_COLORS[entry.level];
    console.log(
      chalk[color](
        `${entry.timestamp} [${entry.level}] ${entry.event.action}`
      ),
      entry.data
    );
  }
};
```

### Log Analysis Tools
- CloudWatch Insights queries
- Error aggregation views
- Performance dashboards
- Activity monitoring 