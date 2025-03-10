import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ImportWizard from './components/import/ImportWizard';
import LoginForm from './components/auth/LoginForm';
import ForgotPassword from './components/auth/ForgotPassword';
import MFASetup from './components/auth/MFASetup';
import ProtectedRoute from './components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/import" element={<ImportWizard accountId="demo" onComplete={() => {}} />} />
          <Route path="/accounts" element={<div>Accounts Page</div>} />
          <Route path="/accounts/new" element={<div>New Account Page</div>} />
          <Route path="/transactions" element={<div>Transactions Page</div>} />
          <Route path="/categories" element={<div>Categories Page</div>} />
          <Route path="/analytics" element={<div>Analytics Page</div>} />
          <Route path="/reports" element={<div>Reports Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/setup-mfa"
            element={
              <ProtectedRoute>
                <MFASetup />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
};

export default App; 