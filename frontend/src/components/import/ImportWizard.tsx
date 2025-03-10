import React from 'react';
import { Typography } from '@mui/material';

interface ImportWizardProps {
  accountId: string;
  onComplete: () => void;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ accountId }) => {
  return (
    <div>
      <Typography variant="h5">Import Transactions</Typography>
      <Typography variant="body1">Account ID: {accountId}</Typography>
    </div>
  );
};

export default ImportWizard; 