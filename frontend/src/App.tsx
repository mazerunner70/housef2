import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import ImportWizard from './components/import/ImportWizard';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
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
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App; 