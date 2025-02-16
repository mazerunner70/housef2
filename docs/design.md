# Design Document for House Finances Monorepo

## Project Overview

The House Finances project aims to provide a comprehensive solution for managing household finances. The application will allow users to track expenses, manage budgets, and visualize financial data. The project will be structured as a monorepo to facilitate easier management of both frontend and backend components.

## Monorepo Structure

The monorepo will be organized into the following directories:
/housef2
│
├── /frontend # Frontend application (React/TypeScript)
│ ├── /src # Source code for the frontend
│ ├── /public # Public assets
│ ├── package.json # Frontend dependencies and scripts
│ └── tsconfig.json # TypeScript configuration for frontend
│
├── /backend # Backend application (Node.js/Express)
│ ├── /src # Source code for the backend
│ ├── /config # Configuration files (e.g., database config)
│ ├── /migrations # Database migrations
│ ├── package.json # Backend dependencies and scripts
│ └── tsconfig.json # TypeScript configuration for backend
│
├── /shared # Shared code between frontend and backend
│ ├── /models # Shared TypeScript models/interfaces
│ └── /utils # Shared utility functions
│
└── package.json # Root package.json for managing workspace

## Technology Stack

### Frontend

- **Framework**: React
- **Language**: TypeScript
- **State Management**: Context API
- **Styling**: styled-components
- **Routing**: React Router
- **Testing**: Jest and React Testing Library

### Backend

- **Framework**: Node.js with Express
- **Language**: TypeScript
- **Database**: AWS Dynamo DB
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Jest and Supertest

### Shared Code

- **Models**: TypeScript interfaces for data models used in both frontend and backend.
- **Utilities**: Common utility functions that can be reused across the application.

## Database Design

### Account Providers
The system will support multiple financial institutions and account types:

- Banks (checking, savings)
- Credit Card Companies
- Investment Accounts
- Cryptocurrency Exchanges
- Manual Account Entries

### Account Data Structure
```json
{
  "accountId": "String",
  "userId": "String",
  "providerName": "String",
  "providerType": "String", // e.g., "BANK", "CREDIT_CARD", "INVESTMENT", "CRYPTO"
  "accountName": "String",
  "accountType": "String", // e.g., "CHECKING", "SAVINGS", "CREDIT", "INVESTMENT"
  "balance": "Number",
  "currency": "String",
  "lastUpdated": "Timestamp",
  "isActive": "Boolean",
  "credentials": {
    "encrypted": "String" // Encrypted connection credentials
  }
}
```

### Provider Integration
- Data will be supplied only by transactions export from the provider
- Each provider may have a different file format that will need to be parsed
- Each account will be added to the system manually

### Data Synchronization
- An synchronisation summary page will show last transaction date and balance for each account

### Account Aggregation Features
- Combined balance view across all accounts
- Category-based spending analysis across accounts
- Cross-account transfer tracking
- Consolidated transaction history
- Custom account grouping

## User Flows

### Home Page Dashboard

#### Account Overview List
The home page presents a consolidated view of all user accounts:

```typescript
interface AccountSummary {
  accountId: string;
  accountName: string;
  institution: string;
  accountType: "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT";
  balance: number;
  currency: string;
  lastUpdated: string;
  lastTransactionDate: string;
  status: "ACTIVE" | "INACTIVE" | "ERROR";
}
```

#### Layout and Features
1. Header Section
   - User identification
   - Total balance across all accounts
   - Quick action buttons (Add Account, Import Transactions)

2. Account List
   - Grouped by institution
   - Each account shows:
     - Account name and last 4 digits
     - Current balance (with currency)
     - Last transaction date
     - Last import date
     - Status indicator
   - Sort options:
     - By institution (default)
     - By balance
     - By last activity
     - By account name

3. Account Status Indicators
   - Green: Recent activity (< 7 days)
   - Yellow: Aging data (7-30 days)
   - Red: Stale data (> 30 days)
   - Grey: Inactive account

4. Quick Actions Per Account
   - Import transactions
   - View transactions
   - View account details
   - Edit account settings

#### Error States
- Connection issues
- Authentication errors
- Stale data warnings
- Import failures

#### Navigation
- Click account for detailed view
- Swipe gestures for mobile
- Keyboard shortcuts for desktop
- Quick filters for account types

#### Example Response
```json
{
  "userId": "u123",
  "totalBalance": {
    "USD": 150000,
    "EUR": 50000
  },
  "lastRefresh": "2024-03-14T15:30:00Z",
  "accounts": [
    {
      "accountId": "acc123",
      "accountName": "Main Checking",
      "institution": "Bank of Example",
      "accountType": "CHECKING",
      "balance": 50000,
      "currency": "USD",
      "lastUpdated": "2024-03-14T15:30:00Z",
      "lastTransactionDate": "2024-03-13T18:45:00Z",
      "status": "ACTIVE"
    },
    {
      "accountId": "acc124",
      "accountName": "Savings",
      "institution": "Bank of Example",
      "accountType": "SAVINGS",
      "balance": 100000,
      "currency": "USD",
      "lastUpdated": "2024-03-12T10:15:00Z",
      "lastTransactionDate": "2024-03-10T14:30:00Z",
      "status": "ACTIVE"
    }
  ],
  "alerts": [
    {
      "accountId": "acc125",
      "type": "STALE_DATA",
      "message": "No updates in 45 days",
      "severity": "WARNING"
    }
  ]
}
```

## Development Workflow

1. **Setup**: Clone the repository and install dependencies for both frontend and backend.
2. **Development**: Use separate terminal sessions for frontend and backend development.
3. **Testing**: Run tests for both frontend and backend using their respective testing frameworks.
4. **Deployment**: Use CI/CD pipelines to deploy the frontend to a static hosting service (e.g., AWS S3) and the backend to a server (e.g., AWS EC2 or AWS Lambda).

## Conclusion

This design document outlines the structure and technology stack for the House Finances monorepo. The proposed architecture will facilitate efficient development and maintenance of both frontend and backend components while allowing for shared code and resources.