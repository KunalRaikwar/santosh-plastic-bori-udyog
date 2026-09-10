import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const getMe = () => api.get('/auth/me');

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const getStockHistory = (id) => api.get(`/products/${id}/stock-history`);

// Customers
export const getCustomers = (params) => api.get('/customers', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// Suppliers
export const getSuppliers = (params) => api.get('/suppliers', { params });
export const getSupplier = (id) => api.get(`/suppliers/${id}`);
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

// Purchases
export const getPurchases = (params) => api.get('/purchases', { params });
export const getPurchase = (id) => api.get(`/purchases/${id}`);
export const createPurchase = (data) => api.post('/purchases', data);
export const cancelPurchase = (id) => api.patch(`/purchases/${id}/cancel`);
export const deletePurchase = (id) => api.delete(`/purchases/${id}`);

// Sales
export const getSales = (params) => api.get('/sales', { params });
export const getSale = (id) => api.get(`/sales/${id}`);
export const createSale = (data) => api.post('/sales', data);
export const cancelSale = (id) => api.patch(`/sales/${id}/cancel`);
export const deleteSale = (id) => api.delete(`/sales/${id}`);

// Payments
export const getPayments = (params) => api.get('/payments', { params });
export const receivePayment = (data) => api.post('/payments/receive', data);
export const paySupplier = (data) => api.post('/payments/pay', data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);

// Expenses
export const getExpenses = (params) => api.get('/expenses', { params });
export const createExpense = (data) => api.post('/expenses', data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`);

// Workers
export const getWorkers = (params) => api.get('/workers', { params });
export const getWorker = (id) => api.get(`/workers/${id}`);
export const createWorker = (data) => api.post('/workers', data);
export const updateWorker = (id, data) => api.put(`/workers/${id}`, data);
export const payWorker = (id, data) => api.post(`/workers/${id}/pay`, data);
export const deleteWorker = (id) => api.delete(`/workers/${id}`);
export const deleteWorkerPayment = (paymentId) => api.delete(`/workers/payment/${paymentId}`);

// Reports
export const getMonthlyReport = (params) => api.get('/reports/monthly', { params });
export const getProfitByProduct = (params) => api.get('/reports/profit-by-product', { params });
export const getCustomerPending = () => api.get('/reports/customer-pending');
export const getSupplierPending = () => api.get('/reports/supplier-pending');

// Ledger
export const getLedger = (partyType, partyId) => api.get(`/ledger/${partyType}/${partyId}`);

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

export default api;
