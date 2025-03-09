import { GetCommand, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({
    send: jest.fn()
  }))
}));

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSend = jest.fn().mockImplementation((command) => {
    if (command instanceof GetCommand) {
      return Promise.resolve({
        Item: {
          PK: 'ACCOUNT#test-account',
          SK: 'IMPORT#test-upload',
          userId: 'test-user',
          status: 'PENDING',
          fileName: 'test.csv',
          analysisData: {
            sampleTransactions: {
              existing: [],
              new: [],
              duplicates: []
            },
            fileStats: {
              transactionCount: 1,
              dateRange: {
                start: '2024-01-01',
                end: '2024-01-01'
              }
            },
            overlapStats: {
              existingTransactions: 0,
              newTransactions: 1,
              potentialDuplicates: 0,
              overlapPeriod: {
                start: '2024-01-01',
                end: '2024-01-01'
              }
            }
          }
        }
      });
    }
    if (command instanceof UpdateCommand) {
      return Promise.resolve({
        Attributes: {
          PK: 'ACCOUNT#test-account',
          SK: 'IMPORT#test-upload',
          status: 'COMPLETED'
        }
      });
    }
    if (command instanceof PutCommand) {
      return Promise.resolve({});
    }
    if (command instanceof QueryCommand) {
      return Promise.resolve({
        Items: []
      });
    }
    return Promise.resolve({});
  });

  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSend
      }))
    },
    GetCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      constructor: GetCommand
    })),
    UpdateCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      constructor: UpdateCommand
    })),
    PutCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      constructor: PutCommand
    })),
    QueryCommand: jest.fn().mockImplementation((params) => ({
      ...params,
      constructor: QueryCommand
    }))
  };
});

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn().mockResolvedValue({
      Body: {
        transformToString: () => Promise.resolve('date,description,amount\n2024-01-01,Test Transaction,100.00')
      }
    })
  }))
}));

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => ({
    send: jest.fn()
  }))
}));

// Export mock implementations for use in tests
export const mockDynamoDBClient = {
  send: jest.fn()
};

export const mockS3Client = {
  send: jest.fn()
};

export const mockLambdaClient = {
  send: jest.fn()
}; 