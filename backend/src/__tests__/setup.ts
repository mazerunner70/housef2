import './mocks/aws-sdk';

// Global test setup
beforeAll(() => {
  // Set environment variables for testing
  process.env.AWS_REGION = 'eu-west-1';
  process.env.DYNAMODB_TABLE_PREFIX = 'test-';
  process.env.IMPORT_BUCKET = 'test-import-bucket';
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 