import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@shared/theme.css';
import { initializeTheme } from '@shared/theme.js';
initializeTheme();
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
