"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_1 = require("./logger");
class S3 {
    constructor() {
        this.client = new client_s3_1.S3Client({});
        this.logger = new logger_1.Logger('s3-util');
        this.bucket = 'housef2-transaction-files';
    }
    async getSignedUploadUrl(params) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: params.key,
                ContentType: params.contentType,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
                expiresIn: params.expiresIn
            });
            return url;
        }
        catch (error) {
            this.logger.error('Error generating signed URL', { error, params });
            throw error;
        }
    }
    async getFileContent(bucket, key) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucket,
                Key: key
            });
            const response = await this.client.send(command);
            const stream = response.Body;
            return new Promise((resolve, reject) => {
                const chunks = [];
                stream.on('data', (chunk) => chunks.push(chunk));
                stream.on('error', reject);
                stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            });
        }
        catch (error) {
            this.logger.error('Error getting file content', { error, bucket, key });
            throw error;
        }
    }
}
exports.S3 = S3;
//# sourceMappingURL=s3.js.map