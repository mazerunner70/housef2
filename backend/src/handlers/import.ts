import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ImportService } from '../services/import';
import { getUserIdFromEvent } from '../utils/auth';
import { createResponse } from '../utils/response';

const importService = new ImportService();

export async function getImports(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const imports = await importService.getImports(userId);
    return createResponse(200, imports);
  } catch (error) {
    console.error('Error getting imports:', error);
    return createResponse(500, { message: 'Failed to get imports' });
  }
}

export async function getImportAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const uploadId = event.pathParameters?.uploadId;
    
    if (!uploadId) {
      return createResponse(400, { message: 'Upload ID is required' });
    }

    const analysis = await importService.getImportAnalysis(userId, uploadId);
    return createResponse(200, analysis);
  } catch (error) {
    console.error('Error getting import analysis:', error);
    return createResponse(500, { message: 'Failed to get import analysis' });
  }
}

export async function getUploadUrl(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return createResponse(400, { message: 'File name and type are required' });
    }

    const result = await importService.getUploadUrl(userId, fileName, fileType);
    return createResponse(200, result);
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return createResponse(500, { message: 'Failed to get upload URL' });
  }
}

export async function confirmImport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const uploadId = event.pathParameters?.uploadId;
    const body = JSON.parse(event.body || '{}');

    if (!uploadId) {
      return createResponse(400, { message: 'Upload ID is required' });
    }

    await importService.confirmImport(userId, {
      uploadId,
      accountId: body.accountId,
      userConfirmations: body.userConfirmations,
      duplicateHandling: body.duplicateHandling
    });

    return createResponse(200, { message: 'Import confirmed successfully' });
  } catch (error) {
    console.error('Error confirming import:', error);
    return createResponse(500, { message: 'Failed to confirm import' });
  }
}

export async function handleWrongAccount(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const uploadId = event.pathParameters?.uploadId;
    const body = JSON.parse(event.body || '{}');

    if (!uploadId) {
      return createResponse(400, { message: 'Upload ID is required' });
    }

    await importService.handleWrongAccount(userId, uploadId, body);
    return createResponse(200, { message: 'Wrong account handled successfully' });
  } catch (error) {
    console.error('Error handling wrong account:', error);
    return createResponse(500, { message: 'Failed to handle wrong account' });
  }
}

export async function deleteImport(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserIdFromEvent(event);
    const uploadId = event.pathParameters?.uploadId;

    if (!uploadId) {
      return createResponse(400, { message: 'Upload ID is required' });
    }

    await importService.deleteImport(userId, uploadId);
    return createResponse(200, { message: 'Import deleted successfully' });
  } catch (error) {
    console.error('Error deleting import:', error);
    return createResponse(500, { message: 'Failed to delete import' });
  }
} 