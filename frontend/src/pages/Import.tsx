import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
  useTheme
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { ImportListItem, ImportAnalysis } from '../types/import';
import { importService } from '../services/importService';
import { useSnackbar } from 'notistack';

const Import: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [imports, setImports] = useState<ImportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImport, setSelectedImport] = useState<ImportListItem | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);

  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = async () => {
    try {
      setLoading(true);
      const importList = await importService.getImports();
      setImports(importList);
    } catch (error) {
      console.error('Error loading imports:', error);
      enqueueSnackbar('Failed to load imports', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';
      const { uploadUrl, uploadId } = await importService.getUploadUrl(file.name, fileType);

      // Upload file to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': importService.getContentType(fileType)
        }
      });

      enqueueSnackbar('File uploaded successfully', { variant: 'success' });
      loadImports();
    } catch (error) {
      console.error('Error uploading file:', error);
      enqueueSnackbar('Failed to upload file', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImport = async (uploadId: string) => {
    try {
      await importService.deleteImport(uploadId);
      enqueueSnackbar('Import deleted successfully', { variant: 'success' });
      loadImports();
    } catch (error) {
      console.error('Error deleting import:', error);
      enqueueSnackbar('Failed to delete import', { variant: 'error' });
    }
  };

  const handleViewAnalysis = async (importItem: ImportListItem) => {
    try {
      const analysisData = await importService.getImportAnalysis(importItem.uploadId);
      setSelectedImport(importItem);
      setAnalysis(analysisData);
      setAnalysisDialogOpen(true);
    } catch (error) {
      console.error('Error loading analysis:', error);
      enqueueSnackbar('Failed to load import analysis', { variant: 'error' });
    }
  };

  const getStatusIcon = (status: ImportListItem['status']) => {
    switch (status) {
      case 'PENDING':
        return <PendingIcon color="action" />;
      case 'ANALYZING':
        return <CircularProgress size={24} />;
      case 'READY':
        return <CheckCircleIcon color="success" />;
      case 'ERROR':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Import Transactions
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Upload transaction files from your bank or credit card statements
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  border: `2px dashed ${theme.palette.divider}`,
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <input
                  accept=".csv,.ofx,.qif"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Select File'}
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Supported formats: CSV, OFX, QIF
                  </Typography>
                </label>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">Recent Imports</Typography>
              <IconButton onClick={loadImports} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Box>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {imports.map((importItem) => (
                  <ListItem key={importItem.uploadId} divider>
                    <ListItemIcon>
                      {getStatusIcon(importItem.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={importItem.fileName}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            {new Date(importItem.uploadTime).toLocaleString()}
                          </Typography>
                          {importItem.fileStats && (
                            <Typography component="span" variant="body2" sx={{ ml: 1 }}>
                              • {importItem.fileStats.transactionCount} transactions
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleViewAnalysis(importItem)}
                        disabled={importItem.status === 'ANALYZING'}
                      >
                        <WarningIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteImport(importItem.uploadId)}
                        disabled={importItem.status === 'ANALYZING'}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {imports.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No imports found"
                      secondary="Upload a transaction file to get started"
                    />
                  </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Import Analysis: {selectedImport?.fileName}
        </DialogTitle>
        <DialogContent>
          {analysis && (
            <Box>
              <Typography variant="h6" gutterBottom>File Statistics</Typography>
              <Typography>
                Transactions: {analysis.fileStats.transactionCount}
              </Typography>
              <Typography>
                Date Range: {new Date(analysis.fileStats.dateRange.start).toLocaleDateString()} - {new Date(analysis.fileStats.dateRange.end).toLocaleDateString()}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Overlap Analysis</Typography>
              <Typography>
                New Transactions: {analysis.overlapStats.newTransactions}
              </Typography>
              <Typography>
                Existing Transactions: {analysis.overlapStats.existingTransactions}
              </Typography>
              <Typography>
                Potential Duplicates: {analysis.overlapStats.potentialDuplicates}
              </Typography>

              {analysis.errors && analysis.errors.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, color: 'error.main' }}>
                    Errors
                  </Typography>
                  <List>
                    {analysis.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <ErrorIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Import; 