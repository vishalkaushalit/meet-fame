import axios from 'axios';
import { createApiClient } from '../../../shared/apiClient';
import { API_BASE } from './endpoints';

export const client = createApiClient(axios, {
  baseURL: API_BASE,
  getToken: () => localStorage.getItem('meetfame_token'),
});
