# Testing Approach Design Decisions

## Overview
This document outlines a pragmatic testing strategy that balances coverage, maintenance effort, and development speed for a small project.

## Testing Pyramid

### Distribution
```typescript
interface TestingDistribution {
  unit: "50%";        // Quick, focused tests
  integration: "30%"; // Key user flows
  e2e: "20%";        // Critical paths only
}
```

## Unit Testing

### Frontend Components
```typescript
// Example component test
describe('AccountCard', () => {
  const defaultProps = {
    account: mockAccount,
    onImport: jest.fn(),
    onView: jest.fn()
  };

  test('renders account details correctly', () => {
    render(<AccountCard {...defaultProps} />);
    expect(screen.getByText(mockAccount.accountName)).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(mockAccount.balance))).toBeInTheDocument();
  });

  test('calls onImport when import button clicked', () => {
    render(<AccountCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /import/i }));
    expect(defaultProps.onImport).toHaveBeenCalledWith(mockAccount.accountId);
  });
});
```

### Backend Functions
```typescript
describe('importAnalyzer', () => {
  test('detects duplicate transactions', async () => {
    const existingTransactions = mockTransactions;
    const newTransactions = [...mockTransactions.slice(0, 2), mockNewTransaction];
    
    const result = await analyzeImport(newTransactions, existingTransactions);
    
    expect(result.duplicates).toHaveLength(2);
    expect(result.newTransactions).toHaveLength(1);
  });
});
```

## Integration Testing

### Key Flows to Test
1. Account Management
   ```typescript
   test('user can add and configure new account', async () => {
     // Login
     await loginUser(mockUser);
     
     // Navigate to accounts
     await navigateToAccounts();
     
     // Add account
     await addNewAccount(mockAccountData);
     
     // Verify account appears
     expect(await screen.findByText(mockAccountData.accountName))
       .toBeInTheDocument();
   });
   ```

2. Transaction Import
   ```typescript
   test('user can import transactions', async () => {
     const file = new File([mockCsvContent], 'transactions.csv');
     
     // Upload file
     await uploadTransactionFile(file);
     
     // Verify analysis
     await verifyImportAnalysis({
       newTransactions: 5,
       duplicates: 2
     });
     
     // Confirm import
     await confirmImport();
     
     // Verify transactions appear
     expect(await screen.findByText('Import Complete')).toBeInTheDocument();
   });
   ```

## E2E Testing

### Critical Paths
```typescript
describe('Critical User Journeys', () => {
  test('new user setup flow', async () => {
    // 1. Sign up
    await signUp(newUserData);
    
    // 2. Add first account
    await addAccount(mockAccountData);
    
    // 3. Import transactions
    await importTransactions(mockTransactionFile);
    
    // 4. View dashboard
    const dashboard = await screen.findByTestId('dashboard');
    expect(dashboard).toContainElement(screen.getByText(mockAccountData.accountName));
    expect(dashboard).toContainElement(screen.getByText('Recent Transactions'));
  });
});
```

## Test Data Management

### Mock Data Strategy
```typescript
// Centralized mock data
const mockData = {
  accounts: generateMockAccounts(3),
  transactions: generateMockTransactions(10),
  users: generateMockUsers(2)
};

// Type-safe mock generators
function generateMockAccount(override?: Partial<Account>): Account {
  return {
    accountId: `acc_${uuid()}`,
    accountName: `Test Account ${Math.random()}`,
    balance: Math.round(Math.random() * 10000),
    ...override
  };
}
```

## Testing Tools

### Core Tools
- Jest for unit/integration tests
- React Testing Library for components
- Cypress for E2E tests
- MSW for API mocking

### Helper Utilities
```typescript
// Custom test hooks
function useTestDatabase() {
  beforeEach(async () => {
    await clearTestData();
    await seedTestData(mockData);
  });
}

// Custom matchers
expect.extend({
  toBeValidTransaction(received: Transaction) {
    const isValid = validateTransaction(received);
    return {
      pass: isValid,
      message: () => `Expected valid transaction but got ${JSON.stringify(received)}`
    };
  }
});
```

## CI Integration

### GitHub Actions Configuration
```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    
    - name: Unit Tests
      run: npm test
      
    - name: Integration Tests
      run: npm run test:integration
      
    - name: E2E Tests
      run: npm run test:e2e
      
    - name: Upload Coverage
      uses: codecov/codecov-action@v1
```

## Testing Guidelines

### Best Practices
1. Test Behavior, Not Implementation
   - Focus on user-visible outcomes
   - Avoid testing implementation details
   - Write tests that survive refactoring

2. Maintainable Tests
   - Keep tests simple and readable
   - Use helper functions for common operations
   - Maintain test data separately from test logic

3. Effective Mocking
   - Mock at boundaries (API, external services)
   - Use realistic mock data
   - Document mock assumptions

4. Performance
   - Keep unit tests fast (< 10ms each)
   - Run slow tests in CI only
   - Parallelize test execution 