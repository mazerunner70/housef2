import { APIGatewayProxyEvent } from 'aws-lambda';
import { ImportService } from '../services/import';
import { getUserIdFromEvent } from '../utils/auth';
import { successResponse, errorResponse } from '../utils/response';
import { Logger } from '../utils/logger';
import { ImportConfirmation } from '@shared/types/import';

const importService = new ImportService();
const logger = new Logger('import-handler');

export async function getImports(event: APIGatewayProxyEvent) {
  try {
    const userId = getUserIdFromEvent(event);
    const imports = await importService.getImports(userId);
    return successResponse(imports);
  } catch (error) {
    logger.error('Error getting imports', { error });
    return errorResponse(error);
  }
}

export async function getImportAnalysis(event: APIGatewayProxyEvent) {
  try {
    const userId = getUserIdFromEvent(event);
    const uploadId = event.pathParameters?.uploadId;
    if (!uploadId) {
      return errorResponse('Upload ID is required', 400);
    }
    const analysis = await importService.getImportAnalysis(userId, uploadId);
    return successResponse(analysis);
  } catch (error) {
    logger.error('Error getting import analysis', { error });
    return errorResponse(error);
  }
}

export async function getUploadUrl(event: APIGatewayProxyEvent) {
  try {
    const userId = getUserIdFromEvent(event);
    const body = JSON.parse(event.body || '{}');
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return errorResponse('File name and type are required', 400);
    }

    const result = await importService.getUploadUrl(userId, fileName, fileType);
    return successResponse(result);
  } catch (error) {
    logger.error('Error getting upload URL', { error });
    return errorResponse(error);
  }
}

export async function confirmImport(event: APIGatewayProxyEvent) {
  try {
    const userId = getUserIdFromEvent(event);
    const body = JSON.parse(event.body || '{}');
    const { uploadId, accountId, userConfirmations, duplicateHandling } = body;

    if (!uploadId || !accountId) {
      return errorResponse('Upload ID and account ID are required', 400);
    }

    const confirmation: ImportConfirmation = {
      uploadId,
      accountId,
      userConfirmations: userConfirmations || [],
      duplicateHandling: duplicateHandling || 'SKIP'
    };

    await importService.confirmImport(userId, confirmation);
    return successResponse({ message: 'Import confirmed' });
  } catch (error) {
    logger.error('Error confirming import', { error });
    return errorResponse(error);
  }
}

export async function handleWrongAccount(event: APIGatewayProxyEvent) {
  try {
    const userId = getUserIdFromEvent(event);
    const body = JSON.parse(event.body || '{}');
    const { uploadId, action } = body;

    if (!uploadId || !action) {
      return errorResponse('Upload ID and action are required', 400);
    }

    await importService.handleWrongAccount(userId, uploadId, action);
    return successResponse({ message: 'Action processed' });
  } catch (error) {
    logger.error('Error handling wrong account', { error });
    return errorResponse(error);
  }
}

export async function deleteImport(event: APIGatewayProxyEvent) {
  try {
    const userId = getUserIdFromEvent(event);
    const uploadId = event.pathParameters?.uploadId;
    if (!uploadId) {
      return errorResponse('Upload ID is required', 400);
    }

    await importService.deleteImport(userId, uploadId);
    return successResponse({ message: 'Import deleted' });
  } catch (error) {
    logger.error('Error deleting import', { error });
    return errorResponse(error);
  }
} 