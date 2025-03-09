import { jest } from '@jest/globals';
import { DynamoDB } from '../../utils/dynamo';
import { S3 } from '../../utils/s3';
import { ImportService } from '../../services/import';

// Mock the dependencies
jest.mock('../../utils/dynamo');
jest.mock('../../utils/s3');

interface DynamoDBParams {
  TableName: string;
  Key: {
    PK: string;
    SK: string;
  };
}

interface ImportRecord {
  Item: {
    status: string;
    userId: string;
    fileName: string;
  } | null;
}

// Create a partial mock type that matches only what we need
type MockDynamoDB = {
  // @ts-ignore - Jest mock typing issues
  get: jest.Mock<Promise<ImportRecord>, [DynamoDBParams]>;
  // @ts-ignore - Jest mock typing issues
  put: jest.Mock<Promise<void>, []>;
  // @ts-ignore - Jest mock typing issues
  update: jest.Mock<Promise<void>, []>;
};

describe('ImportService', () => {
  let mockDynamo: jest.Mocked<DynamoDB>;
  let mockS3: jest.Mocked<S3>;
  let service: ImportService;

  beforeEach(async () => {
    // Setup environment variables
    process.env.IMPORT_BUCKET = 'housef2-imports';
    
    // Setup mocks with type assertions
    // @ts-ignore - Jest mock typing issues
    const mockGet = jest.fn().mockImplementation((params: DynamoDBParams) => {
      if (params.Key.SK.startsWith('IMPORT#')) {
        return Promise.resolve({
          Item: {
            status: 'PENDING',
            userId: 'test-user',
            fileName: 'test.csv'
          }
        });
      }
      return Promise.resolve({ Item: null });
    });

    // @ts-ignore - Jest mock typing issues
    mockDynamo = {
      get: mockGet,
      // @ts-ignore - Jest mock typing issues
      put: jest.fn().mockResolvedValue(Promise.resolve()),
      // @ts-ignore - Jest mock typing issues
      update: jest.fn().mockResolvedValue(Promise.resolve())
    } as jest.Mocked<DynamoDB>;

    // @ts-ignore - Jest mock typing issues
    mockS3 = {
      // @ts-ignore - Jest mock typing issues
      getFileContent: jest.fn().mockImplementation((_bucket: string, _key: string) => Promise.resolve('file content')),
      // @ts-ignore - Jest mock typing issues
      getSignedUploadUrl: jest.fn().mockImplementation((_params: { key: string; contentType: string; expiresIn: number }) => Promise.resolve('https://signed-url'))
    } as jest.Mocked<S3>;

    // Mock constructors
    (DynamoDB as jest.Mock).mockImplementation(() => mockDynamo);
    (S3 as jest.Mock).mockImplementation(() => mockS3);

    service = new ImportService();
  });

  it('should get import status', async () => {
    const result = await service.getImportStatus('account-123', 'upload-123');

    expect(mockDynamo.get).toHaveBeenCalledWith({
      TableName: 'housef2-imports',
      Key: {
        PK: 'ACCOUNT#account-123',
        SK: 'IMPORT#upload-123'
      }
    });
    expect(result).toEqual({
      status: 'PENDING',
      userId: 'test-user',
      fileName: 'test.csv'
    });
  });

  it('should get import file content', async () => {
    const result = await service.getImportFile('account-123', 'upload-123');
    
    const expectedKey = `test-user/account-123/2025/02/original/upload-123_test.csv`;
    const expectedBucket = 'housef2-imports';

    expect(mockS3.getFileContent).toHaveBeenCalledWith(
      expectedBucket,
      expectedKey
    );
    expect(result).toBe('file content');
  });
}); 