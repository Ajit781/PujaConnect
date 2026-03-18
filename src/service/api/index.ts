import axios from 'axios';

const api = axios.create({
  // Replace with API base URL once provided
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    // Modify requests before they are sent (e.g., attaching auth tokens)
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Modify responses or do global error handling here
    return Promise.reject(error);
  },
);

export default api;
