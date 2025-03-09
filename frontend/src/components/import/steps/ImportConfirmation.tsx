import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Button,
  FormControl,
  FormLabel,
  Alert,
  Paper,
  TextField
} from '@mui/material';
import { ImportAnalysis } from '../../../types/import';
import { importService } from '../../../services/importService';

interface ImportConfirmationProps {
  accountId: string;
  uploadId: string;
  analysis: ImportAnalysis;
  onConfirmComplete: () => void;
}

export default function ImportConfirmation({
  accountId,
  uploadId,
  analysis,
  onConfirmComplete
}: ImportConfirmationProps) {
  const [confirmations, setConfirmations] = useState({
    accountVerified: false,
    dateRangeVerified: false,
    samplesReviewed: false
  });

  const [duplicateHandling, setDuplicateHandling] = useState<'SKIP' | 'REPLACE' | 'MARK_DUPLICATE'>('SKIP');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmationChange = (field: keyof typeof confirmations) => {
    setConfirmations(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleSubmit = async () => {
    if (!allConfirmed) {
      setError('Please confirm all checkboxes before proceeding');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await importService.confirmImport({
        accountId,
        uploadId,
        userConfirmations: confirmations,
        duplicateHandling,
        notes: notes.trim() || undefined
      });

      onConfirmComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm import');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirm Import
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Confirmations */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Please confirm the following:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmations.accountVerified}
                onChange={() => handleConfirmationChange('accountVerified')}
              />
            }
            label="I have verified this is the correct account for these transactions"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmations.dateRangeVerified}
                onChange={() => handleConfirmationChange('dateRangeVerified')}
              />
            }
            label="I have verified the date range is correct"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={confirmations.samplesReviewed}
                onChange={() => handleConfirmationChange('samplesReviewed')}
              />
            }
            label="I have reviewed the sample transactions"
          />
        </Box>
      </Paper>

      {/* Duplicate Handling */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl>
          <FormLabel>How should we handle duplicate transactions?</FormLabel>
          <RadioGroup
            value={duplicateHandling}
            onChange={(e) => setDuplicateHandling(e.target.value as typeof duplicateHandling)}
          >
            <FormControlLabel
              value="SKIP"
              control={<Radio />}
              label="Skip duplicate transactions"
            />
            <FormControlLabel
              value="REPLACE"
              control={<Radio />}
              label="Replace existing transactions with new ones"
            />
            <FormControlLabel
              value="MARK_DUPLICATE"
              control={<Radio />}
              label="Import duplicates and mark them as such"
            />
          </RadioGroup>
        </FormControl>
      </Paper>

      {/* Notes */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this import..."
        />
      </Paper>

      {/* Summary */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Import Summary
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Typography>
            New Transactions: {analysis.overlapStats.newTransactions}
          </Typography>
          <Typography>
            Potential Duplicates: {analysis.overlapStats.potentialDuplicates}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!allConfirmed || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Import'}
        </Button>
      </Box>
    </Box>
  );
} 