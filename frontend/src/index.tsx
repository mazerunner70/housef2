import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';

const container = document.getElementById('root');
if (!container) {
    throw new Error('Failed to find the root element');
}

const root = createRoot(container);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Layout>
                {/* Your routes will go here */}
            </Layout>
        </BrowserRouter>
    </React.StrictMode>
); 