import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { ImportAnalysis } from '../../../types/import';
import { importService } from '../../../services/importService';
import { formatCurrency, formatDate } from '../../../utils/formatters';

interface AnalysisReviewProps {
  accountId: string;
  uploadId: string;
  onAnalysisComplete: (analysis: ImportAnalysis) => void;
}

export default function AnalysisReview({
  accountId,
  uploadId,
  onAnalysisComplete
}: AnalysisReviewProps) {
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const analysisData = await importService.pollForAnalysis(accountId, uploadId);
        setAnalysis(analysisData);
        onAnalysisComplete(analysisData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get analysis');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [accountId, uploadId, onAnalysisComplete]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <CircularProgress />
        <Typography>Analyzing file...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Import Analysis
      </Typography>

      {/* File Statistics */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          File Statistics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <Typography>
            Total Transactions: {analysis.fileStats.transactionCount}
          </Typography>
          <Typography>
            Date Range: {formatDate(analysis.fileStats.dateRange.start)} to{' '}
            {formatDate(analysis.fileStats.dateRange.end)}
          </Typography>
        </Box>
      </Paper>

      {/* Overlap Analysis */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Overlap Analysis
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

      {/* Sample Transactions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Sample Transactions
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analysis.sampleTransactions.new.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip label="New" color="primary" size="small" />
                  </TableCell>
                </TableRow>
              ))}
              {analysis.sampleTransactions.duplicates.map(({ new: newTxn, existing }) => (
                <TableRow key={newTxn.id} sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell>{formatDate(newTxn.date)}</TableCell>
                  <TableCell>{newTxn.description}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(newTxn.amount)}
                  </TableCell>
                  <TableCell>
                    <Chip label="Duplicate" color="warning" size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
} 