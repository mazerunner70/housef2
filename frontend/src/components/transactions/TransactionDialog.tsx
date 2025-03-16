import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  FormHelperText,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Transaction } from '../../types/transaction';
import { 
  TransactionCreateRequest, 
  TransactionUpdateRequest, 
  transactionService 
} from '../../services/transactionService';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction;
  accountId: string;
  onSave: () => void;
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  onClose,
  transaction,
  accountId,
  onSave
}) => {
  const isEditing = !!transaction;
  const [date, setDate] = useState<Date | null>(new Date());
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load categories and set form values when dialog opens
  useEffect(() => {
    if (open) {
      loadCategories();
      
      if (transaction) {
        setDate(new Date(transaction.date));
        setAmount(Math.abs(transaction.amount).toString());
        setDescription(transaction.description);
        setCategory(transaction.category || '');
        setType(transaction.amount >= 0 ? 'income' : 'expense');
        setNotes(transaction.notes || '');
      } else {
        // Reset form for new transaction
        setDate(new Date());
        setAmount('');
        setDescription('');
        setCategory('');
        setType('expense');
        setNotes('');
      }
    }
  }, [open, transaction]);

  const loadCategories = async () => {
    try {
      // In a real app, fetch from API
      // const fetchedCategories = await transactionService.getCategories(accountId);
      // setCategories(fetchedCategories);
      
      // Mock categories for now
      setCategories([
        'Food',
        'Income',
        'Dining',
        'Utilities',
        'Shopping',
        'Transportation',
        'Entertainment',
        'Housing',
        'Subscriptions',
        'Transfers'
      ]);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!date) {
      errors.date = 'Date is required';
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      errors.amount = 'Amount must be a positive number';
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const parsedAmount = parseFloat(amount) * (type === 'expense' ? -1 : 1);
      
      if (isEditing && transaction) {
        const updateRequest: TransactionUpdateRequest = {
          id: transaction.id,
          accountId,
          date: date || new Date(),
          amount: parsedAmount,
          description,
          category: category || undefined,
          notes: notes || undefined
        };
        
        // In a real app, call API
        // await transactionService.updateTransaction(updateRequest);
        console.log('Updating transaction:', updateRequest);
      } else {
        const createRequest: TransactionCreateRequest = {
          accountId,
          date: date || new Date(),
          amount: parsedAmount,
          description,
          category: category || undefined,
          notes: notes || undefined
        };
        
        // In a real app, call API
        // await transactionService.createTransaction(createRequest);
        console.log('Creating transaction:', createRequest);
      }
      
      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Transaction' : 'Add Transaction'}
      </DialogTitle>
      
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newValue) => setDate(newValue)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    error: !!validationErrors.date,
                    helperText: validationErrors.date
                  } 
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!validationErrors.amount}>
                <TextField
                  label="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  error={!!validationErrors.amount}
                  helperText={validationErrors.amount}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  value={type}
                  label="Type"
                  onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                >
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="expense">Expense</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                error={!!validationErrors.description}
                helperText={validationErrors.description}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : isEditing ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDialog; 