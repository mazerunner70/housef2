import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  accountId: string;
  onUploadComplete: (uploadId: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ accountId }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    onDrop: () => {
      // Placeholder for now
      console.log('File dropped');
    }
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Transaction File
      </Typography>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          cursor: 'pointer'
        }}
      >
        <input {...getInputProps()} />
        <Typography>
          {isDragActive
            ? 'Drop the file here'
            : 'Drag and drop a CSV file here, or click to select a file'}
        </Typography>
      </Paper>
    </Box>
  );
};

export default FileUpload; 