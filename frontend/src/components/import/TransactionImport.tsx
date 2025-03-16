import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Transaction } from '../../types/transaction';
import { importService, ParsedTransactionFile, TransactionImportResult } from '../../services/importService';

interface TransactionImportProps {
  accountId: string;
  onComplete: (result: TransactionImportResult) => void;
  onCancel: () => void;
}

const steps = ['Upload File', 'Map Columns', 'Review & Import'];

const TransactionImport: React.FC<TransactionImportProps> = ({
  accountId,
  onComplete,
  onCancel
}) => {
  // State for the import process
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsedFile, setParsedFile] = useState<ParsedTransactionFile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<TransactionImportResult | null>(null);
  
  // State for column mapping
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    date: '0',
    description: '1',
    amount: '2',
    category: '3'
  });
  const [skipHeaderRow, setSkipHeaderRow] = useState(true);
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [previewData, setPreviewData] = useState<string[][]>([]);
  
  // File upload handling with react-dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    
    try {
      // Read the first few lines for preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          const lines = content.split(/\r?\n/).slice(0, 6);
          const preview = lines.map(line => 
            line.split(',').map(col => col.trim().replace(/^"|"$/g, ''))
          );
          setPreviewData(preview);
        }
      };
      reader.readAsText(selectedFile);
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setLoading(false);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1
  });
  
  // Handle column mapping changes
  const handleColumnMappingChange = (field: string, value: number) => {
    setColumnMapping({
      ...columnMapping,
      [field]: value.toString()
    });
  };
  
  // Parse the file with the current mapping
  const parseFile = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await importService.parseTransactionFile(file, accountId, {
        columnMapping,
        skipHeaderRow,
        dateFormat
      });
      
      setParsedFile(result);
      setTransactions(result.transactions);
      setLoading(false);
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setLoading(false);
    }
  };
  
  // Import the transactions
  const importTransactions = async () => {
    if (!transactions.length) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await importService.importTransactions(accountId, transactions, {
        duplicateHandling: 'SKIP'
      });
      
      setImportResult(result);
      setLoading(false);
      onComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import transactions');
      setLoading(false);
    }
  };
  
  // Navigation between steps
  const handleNext = () => {
    if (activeStep === 0 && !file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (activeStep === 1) {
      parseFile();
      return;
    }
    
    if (activeStep === 2) {
      importTransactions();
      return;
    }
    
    setActiveStep(prev => prev + 1);
  };
  
  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };
  
  // Render the file upload step
  const renderUploadStep = () => (
    <Box sx={{ p: 3 }}>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease'
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
        
        {isDragActive ? (
          <Typography variant="h6" color="primary">
            Drop the file here...
          </Typography>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              Drag & drop a CSV file here, or click to select
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported formats: CSV, TXT
            </Typography>
          </>
        )}
      </Paper>
      
      {file && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Selected File:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="success" />
            <Typography>
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </Typography>
            <IconButton 
              size="small" 
              color="error" 
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setPreviewData([]);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          
          {previewData.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Preview:
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 200 }}>
                <Table size="small">
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <TableCell key={cellIndex}>{cell}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
  
  // Render the column mapping step
  const renderMappingStep = () => {
    if (!previewData.length) return null;
    
    const headerRow = previewData[0];
    const dataRow = previewData[skipHeaderRow ? 1 : 0] || [];
    
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Map Columns
        </Typography>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Please map the columns in your CSV file to the corresponding transaction fields.
        </Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={skipHeaderRow}
              onChange={(e) => setSkipHeaderRow(e.target.checked)}
            />
          }
          label="First row contains headers"
          sx={{ mb: 2 }}
        />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Date Column</InputLabel>
              <Select
                value={columnMapping.date}
                label="Date Column"
                onChange={(e) => handleColumnMappingChange('date', parseInt(e.target.value))}
              >
                {headerRow.map((header, index) => (
                  <MenuItem key={index} value={index}>
                    {skipHeaderRow ? header : `Column ${index + 1}`}
                    {skipHeaderRow && dataRow[index] && ` (${dataRow[index]})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Date Format</InputLabel>
              <Select
                value={dateFormat}
                label="Date Format"
                onChange={(e) => setDateFormat(e.target.value)}
              >
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                <MenuItem value="YYYY/MM/DD">YYYY/MM/DD</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Description Column</InputLabel>
              <Select
                value={columnMapping.description}
                label="Description Column"
                onChange={(e) => handleColumnMappingChange('description', parseInt(e.target.value))}
              >
                {headerRow.map((header, index) => (
                  <MenuItem key={index} value={index}>
                    {skipHeaderRow ? header : `Column ${index + 1}`}
                    {skipHeaderRow && dataRow[index] && ` (${dataRow[index]})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Amount Column</InputLabel>
              <Select
                value={columnMapping.amount}
                label="Amount Column"
                onChange={(e) => handleColumnMappingChange('amount', parseInt(e.target.value))}
              >
                {headerRow.map((header, index) => (
                  <MenuItem key={index} value={index}>
                    {skipHeaderRow ? header : `Column ${index + 1}`}
                    {skipHeaderRow && dataRow[index] && ` (${dataRow[index]})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Category Column (Optional)</InputLabel>
              <Select
                value={columnMapping.category}
                label="Category Column (Optional)"
                onChange={(e) => handleColumnMappingChange('category', parseInt(e.target.value))}
              >
                <MenuItem value={-1}>No Category</MenuItem>
                {headerRow.map((header, index) => (
                  <MenuItem key={index} value={index}>
                    {skipHeaderRow ? header : `Column ${index + 1}`}
                    {skipHeaderRow && dataRow[index] && ` (${dataRow[index]})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Data Preview:
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Row</TableCell>
                  {headerRow.map((header, index) => (
                    <TableCell key={index}>
                      {skipHeaderRow ? header : `Column ${index + 1}`}
                      {Object.entries(columnMapping).map(([field, colIndex]) => 
                        parseInt(colIndex) === index ? (
                          <Chip 
                            key={field} 
                            label={field} 
                            size="small" 
                            color="primary" 
                            sx={{ ml: 1 }}
                          />
                        ) : null
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.slice(skipHeaderRow ? 1 : 0, 5).map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell>{skipHeaderRow ? rowIndex + 1 : rowIndex}</TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    );
  };
  
  // Render the review and import step
  const renderReviewStep = () => {
    if (!transactions.length) return null;
    
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Review Transactions
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {transactions.length} transactions found in the file. Please review before importing.
            </Typography>
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Transactions
                </Typography>
                <Typography variant="h4">{transactions.length}</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Income Transactions
                </Typography>
                <Typography variant="h4" color="success.main">
                  {transactions.filter(t => t.amount > 0).length}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Expense Transactions
                </Typography>
                <Typography variant="h4" color="error.main">
                  {transactions.filter(t => t.amount < 0).length}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Date Range
                </Typography>
                <Typography variant="body1">
                  {format(
                    new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))),
                    'MMM d, yyyy'
                  )}
                  {' - '}
                  {format(
                    new Date(Math.max(...transactions.map(t => new Date(t.date).getTime()))),
                    'MMM d, yyyy'
                  )}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.slice(0, 100).map((transaction, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                    >
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'income' ? 'Income' : 'Expense'}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length > 100 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="textSecondary">
                      {transactions.length - 100} more transactions not shown
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };
  
  // Render the current step
  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderMappingStep();
      case 2:
        return renderReviewStep();
      default:
        return null;
    }
  };
  
  return (
    <Paper sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5">Import Transactions</Typography>
      </Box>
      
      <Stepper activeStep={activeStep} sx={{ p: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mx: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderStep()
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={onCancel}
          variant="outlined"
        >
          Cancel
        </Button>
        
        <Box>
          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              sx={{ mr: 1 }}
              startIcon={<BackIcon />}
            >
              Back
            </Button>
          )}
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <NextIcon />}
            disabled={loading || (activeStep === 0 && !file)}
          >
            {activeStep === steps.length - 1 ? 'Import' : 'Next'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default TransactionImport; 