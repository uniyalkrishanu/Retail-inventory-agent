import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth
export const login = (credentials) => api.post('/auth/login', credentials, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});
export const getMe = () => api.get('/auth/me');

// Inventory
export const getInventory = (params) => api.get('/inventory/', { params });
export const getItem = (id) => api.get(`/inventory/${id}`);
export const createItem = (item) => api.post('/inventory/', item);
export const updateItem = (id, item) => api.put(`/inventory/${id}`, item);
export const deleteItem = (id) => api.delete(`/inventory/${id}`);

// Customers & Ledger
export const getCustomers = (params) => api.get('/customers/', { params });
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers/', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const getCustomerRecommendations = (id) => api.get(`/customers/${id}/recommendations`);
export const registerCustomerPayment = (id, amount) => api.post(`/customers/${id}/payments?amount=${amount}`);

// Vendors
export const getVendors = (params) => api.get('/vendors/', { params });
export const createVendor = (data) => api.post('/vendors/', data);
export const updateVendor = (id, data) => api.put(`/vendors/${id}`, data);
export const deleteVendor = (id) => api.delete(`/vendors/${id}`);
export const getVendorPurchases = (id) => api.get(`/vendors/${id}/purchases`);
export const registerVendorPayment = (id, amount) => api.post(`/vendors/${id}/payments?amount=${amount}`);

// Sales
export const createSale = (saleData) => api.post('/sales/', saleData);
export const getSales = (params) => api.get('/sales/', { params });
export const getUniqueCustomers = () => api.get('/sales/customers');
export const paySale = (id, amount) => api.post(`/sales/${id}/pay`, { amount });
export const unpaySale = (id) => api.post(`/sales/${id}/unpay`);
export const updateSale = (id, data) => api.put(`/sales/${id}`, data);
export const deleteSale = (id) => api.delete(`/sales/${id}`);

// Purchases
export const getPurchases = (params) => api.get('/purchases/', { params });
export const deletePurchase = (id, revertStock) => api.delete(`/purchases/${id}?revert_stock=${revert_stock}`);
export const payPurchase = (id, amount) => api.post(`/purchases/${id}/pay`, { amount });
export const unpayPurchase = (id) => api.post(`/purchases/${id}/unpay`);

// Analytics & Insights
export const getDashboardStats = (params) => api.get('/analytics/dashboard', { params });
export const getSalesTrend = (params) => api.get('/analytics/sales_trend', { params });
export const getBusinessSummary = () => api.get('/insights/business-summary');
export const chatWithAssistant = (query) => api.post(`/insights/chat?query=${encodeURIComponent(query)}`);

// Import/Export
export const importData = (formData) => api.post('/import_export/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
});
export const exportInventory = () => api.get('/import_export/export', { responseType: 'blob' });

export default api;
