import { initializeRequiredFields } from '@shared/requiredFields.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import '@shared/theme.css';
import { initializeDatePickers } from '@shared/datePicker.js';
import { initializeTheme } from '@shared/theme.js';
initializeTheme();
initializeDatePickers();
initializeRequiredFields();
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
