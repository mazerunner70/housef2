import React, { useState, useCallback } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import { importService } from '../../../services/importService';

interface FileUploadProps {
  accountId: string;
  onUploadComplete: (uploadId: string) => void;
}

export default function FileUpload({ accountId, onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length !== 1) {
      setError('Please upload a single file');
      return;
    }

    const file = acceptedFiles[0];
    setIsUploading(true);
    setError(null);

    try {
      // Initiate the import
      const { uploadId, uploadUrl } = await importService.initiateImport({
        accountId,
        fileName: file.name,
        fileType: 'CSV',
        contentType: file.type
      });

      // Upload the file
      await importService.uploadFile(uploadUrl, file);

      onUploadComplete(uploadId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [accountId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Box
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress />
            <Typography>Uploading file...</Typography>
          </Box>
        ) : (
          <Typography>
            {isDragActive
              ? 'Drop the file here'
              : 'Drag and drop a CSV file here, or click to select a file'}
          </Typography>
        )}
      </Box>

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}

      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Supported file format: CSV
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Maximum file size: 10MB
        </Typography>
      </Box>
    </Box>
  );
} 