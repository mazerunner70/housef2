"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateConfirmation = exports.validateImportRequest = void 0;
const errors_1 = require("./errors");
function validateImportRequest(request) {
    const requiredFields = ['accountId', 'fileName', 'fileType', 'contentType'];
    for (const field of requiredFields) {
        if (!request[field]) {
            throw new errors_1.ValidationError(`Missing required field: ${field}`);
        }
    }
    // Validate file type
    const allowedFileTypes = ['CSV', 'OFX', 'QFX', 'PDF'];
    if (!allowedFileTypes.includes(request.fileType.toUpperCase())) {
        throw new errors_1.ValidationError(`Unsupported file type: ${request.fileType}`);
    }
    // Validate content type
    const allowedContentTypes = [
        'text/csv',
        'application/x-ofx',
        'application/x-qfx',
        'application/pdf'
    ];
    if (!allowedContentTypes.includes(request.contentType.toLowerCase())) {
        throw new errors_1.ValidationError(`Unsupported content type: ${request.contentType}`);
    }
}
exports.validateImportRequest = validateImportRequest;
function validateConfirmation(request) {
    // Check required fields
    if (!request.userConfirmations) {
        throw new errors_1.ValidationError('Missing userConfirmations');
    }
    const requiredConfirmations = [
        'accountVerified',
        'dateRangeVerified',
        'samplesReviewed'
    ];
    for (const field of requiredConfirmations) {
        if (typeof request.userConfirmations[field] !== 'boolean') {
            throw new errors_1.ValidationError(`Missing confirmation: ${field}`);
        }
    }
    // Check duplicate handling strategy
    const validStrategies = ['SKIP', 'REPLACE', 'MARK_DUPLICATE'];
    if (!validStrategies.includes(request.duplicateHandling)) {
        throw new errors_1.ValidationError(`Invalid duplicate handling strategy: ${request.duplicateHandling}`);
    }
}
exports.validateConfirmation = validateConfirmation;
//# sourceMappingURL=validation.js.map