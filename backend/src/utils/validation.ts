import { ValidationError } from './errors';

export function validateImportRequest(request: any) {
  const requiredFields = ['accountId', 'fileName', 'fileType', 'contentType'];
  
  for (const field of requiredFields) {
    if (!request[field]) {
      throw new ValidationError(`Missing required field: ${field}`);
    }
  }
  
  // Validate file type
  const allowedFileTypes = ['CSV', 'OFX', 'QFX', 'PDF'];
  if (!allowedFileTypes.includes(request.fileType.toUpperCase())) {
    throw new ValidationError(`Unsupported file type: ${request.fileType}`);
  }
  
  // Validate content type
  const allowedContentTypes = [
    'text/csv',
    'application/x-ofx',
    'application/x-qfx',
    'application/pdf'
  ];
  if (!allowedContentTypes.includes(request.contentType.toLowerCase())) {
    throw new ValidationError(`Unsupported content type: ${request.contentType}`);
  }
}

export function validateConfirmation(request: any) {
  // Check required fields
  if (!request.userConfirmations) {
    throw new ValidationError('Missing userConfirmations');
  }
  
  const requiredConfirmations = [
    'accountVerified',
    'dateRangeVerified',
    'samplesReviewed'
  ];
  
  for (const field of requiredConfirmations) {
    if (typeof request.userConfirmations[field] !== 'boolean') {
      throw new ValidationError(`Missing confirmation: ${field}`);
    }
  }
  
  // Check duplicate handling strategy
  const validStrategies = ['SKIP', 'REPLACE', 'MARK_DUPLICATE'];
  if (!validStrategies.includes(request.duplicateHandling)) {
    throw new ValidationError(`Invalid duplicate handling strategy: ${request.duplicateHandling}`);
  }
} 