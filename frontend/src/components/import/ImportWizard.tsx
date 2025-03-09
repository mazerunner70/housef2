import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography } from '@mui/material';
import FileUpload from './steps/FileUpload';
import AnalysisReview from './steps/AnalysisReview';
import ImportConfirmation from './steps/ImportConfirmation';
import { ImportStatus, ImportAnalysis } from '../../types/import';

const steps = ['Select File', 'Review Analysis', 'Confirm Import'];

interface ImportWizardProps {
  accountId: string;
  onComplete: () => void;
}

export default function ImportWizard({ accountId, onComplete }: ImportWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysis | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>('PENDING');

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleUploadComplete = (newUploadId: string) => {
    setUploadId(newUploadId);
    handleNext();
  };

  const handleAnalysisComplete = (analysisData: ImportAnalysis) => {
    setAnalysis(analysisData);
    handleNext();
  };

  const handleImportComplete = () => {
    setImportStatus('COMPLETED');
    onComplete();
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <FileUpload
            accountId={accountId}
            onUploadComplete={handleUploadComplete}
          />
        );
      case 1:
        return (
          <AnalysisReview
            accountId={accountId}
            uploadId={uploadId!}
            onAnalysisComplete={handleAnalysisComplete}
          />
        );
      case 2:
        return (
          <ImportConfirmation
            accountId={accountId}
            uploadId={uploadId!}
            analysis={analysis!}
            onConfirmComplete={handleImportComplete}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Stepper activeStep={activeStep}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4, mb: 2 }}>
        {activeStep === steps.length ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Import completed successfully!
            </Typography>
            <Button onClick={onComplete}>Return to Dashboard</Button>
          </Box>
        ) : (
          <>
            {getStepContent(activeStep)}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
              >
                Back
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
} 