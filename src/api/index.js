import axios from 'axios';

const API = axios.create({
  
  baseURL: 'http://localhost:5055/api',
});


API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {

    req.headers['authorization'] = token;
  }
  return req;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH
export const signup = (data) => API.post('/auth/signup', data);
export const login  = (data) => API.post('/auth/login',  data);

// ─── PROJECTS 
export const getProjects   = ()             => API.get('/projects');
export const createProject = (data)         => API.post('/projects', data);
export const addMember     = (projectId, userId) =>
  API.post(`/projects/${projectId}/add-member`, { userId });

// ─── TASKS 
export const getTasksByProject = (projectId) => API.get(`/tasks/${projectId}`);
export const createTask        = (data)       => API.post('/tasks', data);
export const updateTask        = (id, data)   => API.put(`/tasks/${id}`, data);

// ─── DASHBOARD 
export const getDashboard = () => API.get('/dashboard');

export default API;
