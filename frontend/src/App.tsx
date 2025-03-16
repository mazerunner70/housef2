import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import MFASetup from './components/auth/MFASetup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Import from './pages/Import';
import Settings from './pages/Settings';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const { currentUser } = useAuth();
  
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!currentUser ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/reset-password" element={!currentUser ? <ResetPassword /> : <Navigate to="/" />} />
        
        {/* Protected routes with Layout */}
        <Route path="/" element={
          currentUser ? (
            <Layout>
              <Dashboard />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/transactions" element={
          currentUser ? (
            <Layout>
              <Transactions />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/import" element={
          currentUser ? (
            <Layout>
              <Import />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/settings" element={
          currentUser ? (
            <Layout>
              <Settings />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/mfa-setup" element={
          currentUser ? (
            <Layout>
              <MFASetup />
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/accounts" element={
          currentUser ? (
            <Layout>
              <div>Accounts Page</div>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/accounts/new" element={
          currentUser ? (
            <Layout>
              <div>New Account Page</div>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/accounts/:id" element={
          currentUser ? (
            <Layout>
              <div>Account Details Page</div>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </ThemeProvider>
  );
};

export default App; 