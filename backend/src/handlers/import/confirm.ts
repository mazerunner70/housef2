import { APIGatewayProxyEvent } from 'aws-lambda';
import { ImportService } from '../../services/import';
import { getUserIdFromEvent } from '../../utils/auth';
import { successResponse, errorResponse } from '../../utils/response';
import { Logger } from '../../utils/logger';
import { ImportConfirmation } from '@shared/types/import';

const importService = new ImportService();
const logger = new Logger('import-handler');

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