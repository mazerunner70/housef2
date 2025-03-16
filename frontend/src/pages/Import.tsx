import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Tabs, 
  Tab, 
  Alert, 
  Snackbar,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  CloudDownload as ImportIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { importService, ImportStatus } from '../services/importService';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`import-tabpanel-${index}`}
      aria-labelledby={`import-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `import-tab-${index}`,
    'aria-controls': `import-tabpanel-${index}`,
  };
}

const ImportPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [imports, setImports] = useState<ImportStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportStatus | null>(null);
  const [notes, setNotes] = useState('');
  const { currentUser } = useAuth();
  
  // Load imports when the component mounts
  useEffect(() => {
    if (currentUser?.accountId) {
      loadImports();
    }
  }, [currentUser]);
  
  const loadImports = async () => {
    if (!currentUser?.accountId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const importList = await importService.getImports(currentUser.accountId);
      setImports(importList);
    } catch (err) {
      setError('Failed to load imports. Please try again.');
      console.error('Error loading imports:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // File upload handling with react-dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!currentUser?.accountId || acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setLoading(true);
    setError(null);
    
    try {
      // Initiate the import
      const { uploadUrl, uploadId } = await importService.initiateImport(currentUser.accountId, file);
      
      // Upload the file
      await importService.uploadFile(uploadUrl, file);
      
      // Refresh the import list
      await loadImports();
      
      setSuccessMessage(`File "${file.name}" uploaded successfully`);
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Error uploading file:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });
  
  const handleDeleteImport = async (importId: string) => {
    if (!currentUser?.accountId) return;
    
    try {
      await importService.deleteImport(currentUser.accountId, importId);
      setImports(imports.filter(imp => imp.uploadId !== importId));
      setSuccessMessage('Import deleted successfully');
    } catch (err) {
      setError('Failed to delete import. Please try again.');
      console.error('Error deleting import:', err);
    }
  };
  
  const handleViewImport = (importItem: ImportStatus) => {
    setSelectedImport(importItem);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedImport(null);
    setNotes('');
  };
  
  const handleProcessImport = async () => {
    if (!currentUser?.accountId || !selectedImport) return;
    
    setLoading(true);
    
    try {
      await importService.confirmImport({
        accountId: currentUser.accountId,
        uploadId: selectedImport.uploadId,
        userConfirmations: {
          accountVerified: true,
          dateRangeVerified: true,
          samplesReviewed: true
        },
        duplicateHandling: 'SKIP',
        notes: notes
      });
      
      await loadImports();
      setSuccessMessage('Import processing started');
      handleCloseDialog();
    } catch (err) {
      setError('Failed to process import. Please try again.');
      console.error('Error processing import:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const renderFileUpload = () => (
    <Paper
      {...getRootProps()}
      sx={{
        p: 4,
        mb: 4,
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.400',
        bgcolor: isDragActive ? 'primary.50' : 'background.paper',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      <input {...getInputProps()} />
      <UploadIcon sx={{ fontSize: 48, color: isDragActive ? 'primary.main' : 'grey.500', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
      </Typography>
      <Typography color="textSecondary" variant="body2">
        Supported formats: CSV, XLS, XLSX
      </Typography>
      {loading && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Paper>
  );
  
  const renderImportList = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File Name</TableCell>
            <TableCell>Upload Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {imports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No imports found. Upload a file to get started.
              </TableCell>
            </TableRow>
          ) : (
            imports.map((importItem) => (
              <TableRow key={importItem.uploadId}>
                <TableCell>{importItem.fileName}</TableCell>
                <TableCell>{format(new Date(importItem.createdAt), 'MMM d, yyyy h:mm a')}</TableCell>
                <TableCell>
                  <Chip 
                    label={importItem.status} 
                    color={
                      importItem.status === 'COMPLETED' ? 'success' :
                      importItem.status === 'FAILED' ? 'error' :
                      importItem.status === 'PROCESSING' ? 'warning' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => handleViewImport(importItem)}
                    disabled={importItem.status === 'PROCESSING'}
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  {importItem.status === 'UPLOADED' && (
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleViewImport(importItem)}
                    >
                      <ImportIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteImport(importItem.uploadId)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
  
  const renderImportSettings = () => (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Import Settings
      </Typography>
      <Typography color="textSecondary" paragraph>
        Configure your default import settings below.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Import settings will be saved and applied to future imports automatically.
      </Alert>
      
      <Typography variant="subtitle1" gutterBottom>
        Coming soon:
      </Typography>
      <ul>
        <li>Default category mapping</li>
        <li>Merchant name normalization</li>
        <li>Automatic categorization rules</li>
        <li>Duplicate handling preferences</li>
      </ul>
    </Paper>
  );
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Import Transactions
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="import tabs"
          variant="fullWidth"
        >
          <Tab label="Upload" icon={<UploadIcon />} iconPosition="start" {...a11yProps(0)} />
          <Tab label="History" icon={<HistoryIcon />} iconPosition="start" {...a11yProps(1)} />
          <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" {...a11yProps(2)} />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Upload Transaction File
        </Typography>
        <Typography paragraph>
          Upload a CSV or Excel file containing your transactions. The file will be processed and you'll be able to review the transactions before importing them.
        </Typography>
        
        {renderFileUpload()}
        
        <Typography variant="h6" gutterBottom>
          Recent Uploads
        </Typography>
        {renderImportList()}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Import History
        </Typography>
        <Typography paragraph>
          View all your previous imports and their status.
        </Typography>
        
        {loading && imports.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderImportList()
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={loadImports}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        {renderImportSettings()}
      </TabPanel>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedImport?.status === 'UPLOADED' ? 'Process Import' : 'Import Details'}
        </DialogTitle>
        <DialogContent>
          {selectedImport && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">File Name</Typography>
                  <Typography>{selectedImport.fileName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Upload Date</Typography>
                  <Typography>
                    {format(new Date(selectedImport.createdAt), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Chip 
                    label={selectedImport.status} 
                    color={
                      selectedImport.status === 'COMPLETED' ? 'success' :
                      selectedImport.status === 'FAILED' ? 'error' :
                      selectedImport.status === 'PROCESSING' ? 'warning' : 'default'
                    }
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Last Updated</Typography>
                  <Typography>
                    {format(new Date(selectedImport.updatedAt), 'MMM d, yyyy h:mm a')}
                  </Typography>
                </Grid>
              </Grid>
              
              {selectedImport.status === 'UPLOADED' && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Import Notes (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Add any notes about this import..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Box>
              )}
              
              {selectedImport.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {selectedImport.error.message}
                </Alert>
              )}
              
              {selectedImport.analysisData && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Analysis Results
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Transactions</TableCell>
                          <TableCell align="right">
                            {selectedImport.analysisData.fileStats?.transactionCount || 0}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Date Range</TableCell>
                          <TableCell align="right">
                            {selectedImport.analysisData.fileStats?.dateRange?.start} to {selectedImport.analysisData.fileStats?.dateRange?.end}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Potential Duplicates</TableCell>
                          <TableCell align="right">
                            {selectedImport.analysisData.overlapStats?.potentialDuplicates || 0}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Close
          </Button>
          {selectedImport?.status === 'UPLOADED' && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleProcessImport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <ImportIcon />}
            >
              Process Import
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Container>
  );
};

export default ImportPage; 