import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Should be env var in prod

const api = axios.create({
    baseURL: API_URL,
});

export const getInventory = () => api.get('/inventory/');
export const getItem = (id) => api.get(`/inventory/${id}`);
export const createItem = (item) => api.post('/inventory/', item);
export const updateItem = (id, item) => api.put(`/inventory/${id}`, item);
export const deleteItem = (id) => api.delete(`/inventory/${id}`);

export const importInventory = (formData) => api.post('/import_export/import', formData, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});
export const exportInventory = () => api.get('/import_export/export', { responseType: 'blob' });

export const createSale = (saleData) => api.post('/sales/', saleData);
export const getSales = () => api.get('/sales/');

export default api;
