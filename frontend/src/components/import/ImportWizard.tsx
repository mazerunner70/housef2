import React from 'react';
import { Box, Typography } from '@mui/material';
import FileUpload from './steps/FileUpload';

interface ImportWizardProps {
  accountId: string;
  onComplete: () => void;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ accountId, onComplete }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Import Transactions</Typography>
      <FileUpload 
        accountId={accountId} 
        onUploadComplete={() => onComplete()} 
      />
    </Box>
  );
};

export default ImportWizard; 