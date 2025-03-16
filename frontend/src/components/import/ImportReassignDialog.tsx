import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface Account {
  id: string;
  name: string;
}

interface ImportReassignDialogProps {
  open: boolean;
  onClose: () => void;
  importId: string;
  currentAccountId: string;
  onReassign: (importId: string, currentAccountId: string, newAccountId: string) => Promise<void>;
}

const ImportReassignDialog: React.FC<ImportReassignDialogProps> = ({
  open,
  onClose,
  importId,
  currentAccountId,
  onReassign
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Fetch accounts when the dialog opens
  useEffect(() => {
    if (open) {
      fetchAccounts();
    }
  }, [open]);

  const fetchAccounts = async () => {
    // This would be replaced with an actual API call
    // For now, we'll use dummy data
    setAccounts([
      { id: 'account1', name: 'Checking Account' },
      { id: 'account2', name: 'Savings Account' },
      { id: 'account3', name: 'Investment Account' },
      { id: 'account4', name: 'Credit Card' }
    ]);
  };

  const handleAccountChange = (event: SelectChangeEvent) => {
    setSelectedAccountId(event.target.value);
  };

  const handleReassign = async () => {
    if (!selectedAccountId) {
      setError('Please select an account');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await onReassign(importId, currentAccountId, selectedAccountId);
      setSuccess(true);
      
      // Close the dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reassign import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reassign Import</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            Select the account you want to reassign this import to:
          </Typography>
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="account-select-label">Account</InputLabel>
            <Select
              labelId="account-select-label"
              id="account-select"
              value={selectedAccountId}
              label="Account"
              onChange={handleAccountChange}
              disabled={loading}
            >
              {accounts
                .filter(account => account.id !== currentAccountId)
                .map(account => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Import successfully reassigned
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleReassign} 
          variant="contained" 
          color="primary"
          disabled={loading || !selectedAccountId || selectedAccountId === currentAccountId}
        >
          {loading ? <CircularProgress size={24} /> : 'Reassign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportReassignDialog; 