const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '3000' && window.location.hostname === 'localhost'
    ? 'http://localhost:5001/api'
    : '/api');

export const api = {
  // Stats
  async getStats() {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Customers
  async getCustomers(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/customers${query}`);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async getCustomerById(id) {
    const res = await fetch(`${API_BASE_URL}/customers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch customer details');
    return res.json();
  },

  async createCustomer(data) {
    const res = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create customer');
    return result;
  },

  // Purchases
  async getDiscountPreview(customerId, amount) {
    const res = await fetch(
      `${API_BASE_URL}/purchases/discount-preview?customerId=${encodeURIComponent(customerId)}&amount=${encodeURIComponent(amount)}`
    );
    if (!res.ok) throw new Error('Failed to fetch discount preview');
    return res.json();
  },

  async getPurchases(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE_URL}/purchases${query}`);
    if (!res.ok) throw new Error('Failed to fetch purchases');
    return res.json();
  },

  async createPurchase(data) {
    const res = await fetch(`${API_BASE_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to record purchase');
    return result;
  },
};

