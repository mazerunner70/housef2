"use strict";
// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn(() => ({
        send: jest.fn()
    }))
}));
jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(() => ({
        send: jest.fn()
    }))
}));
jest.mock('@aws-sdk/client-lambda', () => ({
    LambdaClient: jest.fn(() => ({
        send: jest.fn()
    }))
}));
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
//# sourceMappingURL=setup.js.map