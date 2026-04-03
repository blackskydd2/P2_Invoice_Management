import apiClient from './apiClient';

export const invoiceApi = {
  // Invoices
  getAll: (params) => apiClient.get('/api/invoices', { params }).then(r => r.data),
  getById: (id) => apiClient.get(`/api/invoices/${id}`).then(r => r.data),
  create: (data) => apiClient.post('/api/invoices', data).then(r => r.data),
  update: (id, data) => apiClient.put(`/api/invoices/${id}`, data).then(r => r.data),
  delete: (id) => apiClient.delete(`/api/invoices/${id}`).then(r => r.data),
  changeStatus: (id, status) => apiClient.patch(`/api/invoices/${id}/status`, { status }).then(r => r.data),

  // Line Items
  getItems: (invoiceId) => apiClient.get(`/api/invoices/${invoiceId}/items`).then(r => r.data),
  addItem: (invoiceId, data) => apiClient.post(`/api/invoices/${invoiceId}/items`, data).then(r => r.data),
  updateItem: (invoiceId, itemId, data) => apiClient.put(`/api/invoices/${invoiceId}/items/${itemId}`, data).then(r => r.data),
  deleteItem: (invoiceId, itemId) => apiClient.delete(`/api/invoices/${invoiceId}/items/${itemId}`).then(r => r.data),

  // Payments
  getPayments: (invoiceId) => apiClient.get(`/api/invoices/${invoiceId}/payments`).then(r => r.data),
  addPayment: (invoiceId, data) => apiClient.post(`/api/invoices/${invoiceId}/payments`, data).then(r => r.data),

  // Analytics
  getAging: () => apiClient.get('/api/invoices/analytics/aging').then(r => r.data),
  getRevenueSummary: () => apiClient.get('/api/invoices/analytics/revenue-summary').then(r => r.data),
  getDso: () => apiClient.get('/api/invoices/analytics/dso').then(r => r.data),
  getOutstanding: () => apiClient.get('/api/invoices/analytics/outstanding').then(r => r.data),
};
