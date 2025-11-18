// Use environment variable or detect if on mobile network
const getApiBaseUrl = () => {
  // Check if we're accessing from a mobile device (different hostname)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If not localhost, use the same hostname for API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000/api`;
    }
  }
  // Default to localhost for development
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

export const api = {
  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/products?${query}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch products' }));
      throw new Error(error.error || 'Failed to fetch products');
    }
    return response.json();
  },

  async getProductById(id) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch product' }));
      throw new Error(error.error || 'Failed to fetch product');
    }
    return response.json();
  },

  async getProductByUpc(upc) {
    const response = await fetch(`${API_BASE_URL}/products/upc/${upc}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Product not found' }));
      throw new Error(error.error || 'Product not found');
    }
    return response.json();
  },

  async createProduct(product) {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create product' }));
      throw new Error(error.error || 'Failed to create product');
    }
    return response.json();
  },

  async updateProduct(id, product) {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update product' }));
      throw new Error(error.error || 'Failed to update product');
    }
    return response.json();
  },

  async getUnconfiguredProducts() {
    const response = await fetch(`${API_BASE_URL}/products?status=UNCONFIGURED`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch unconfigured products' }));
      throw new Error(error.error || 'Failed to fetch unconfigured products');
    }
    return response.json();
  },

  // Styles
  async getStyles() {
    const response = await fetch(`${API_BASE_URL}/styles`);
    if (!response.ok) throw new Error('Failed to fetch styles');
    return response.json();
  },

  // Locations
  async getBackroomLocations() {
    const response = await fetch(`${API_BASE_URL}/locations/backroom`);
    if (!response.ok) throw new Error('Failed to fetch backroom locations');
    return response.json();
  },

  async getLocationByCode(code) {
    const response = await fetch(`${API_BASE_URL}/locations/${code}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Location not found' }));
      throw new Error(error.error || 'Location not found');
    }
    return response.json();
  },

  async getLocationProducts(code) {
    const response = await fetch(`${API_BASE_URL}/locations/${code}/products`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch location products' }));
      throw new Error(error.error || 'Failed to fetch location products');
    }
    return response.json();
  },

  async getSalesFloorLocations() {
    const response = await fetch(`${API_BASE_URL}/locations/sales-floor`);
    if (!response.ok) throw new Error('Failed to fetch sales floor locations');
    return response.json();
  },

  async createBackroomLocation(data) {
    const response = await fetch(`${API_BASE_URL}/locations/backroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create backroom location' }));
      throw new Error(error.error || 'Failed to create backroom location');
    }
    return response.json();
  },

  async createSalesFloorLocation(data) {
    const response = await fetch(`${API_BASE_URL}/locations/sales-floor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create sales floor location' }));
      throw new Error(error.error || 'Failed to create sales floor location');
    }
    return response.json();
  },

  async getDepartments() {
    const response = await fetch(`${API_BASE_URL}/locations/departments`);
    if (!response.ok) throw new Error('Failed to fetch departments');
    return response.json();
  },

  async getParentFixtures(departmentId) {
    const query = departmentId ? `?departmentId=${departmentId}` : '';
    const response = await fetch(`${API_BASE_URL}/locations/parent-fixtures${query}`);
    if (!response.ok) throw new Error('Failed to fetch parent fixtures');
    return response.json();
  },

  // Inventory Movements
  async getMovements(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/inventory/movements?${query}`);
    if (!response.ok) throw new Error('Failed to fetch movements');
    return response.json();
  },

  async placeInBack(data) {
    const response = await fetch(`${API_BASE_URL}/inventory/place-in-back`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to place in backroom' }));
      throw new Error(error.error || 'Failed to place in backroom');
    }
    return response.json();
  },

  async placeOnFloor(data) {
    const response = await fetch(`${API_BASE_URL}/inventory/place-on-floor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to place on floor' }));
      throw new Error(error.error || 'Failed to place on floor');
    }
    return response.json();
  },

  async pullFromBack(data) {
    const response = await fetch(`${API_BASE_URL}/inventory/pull-from-back`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to pull from backroom' }));
      throw new Error(error.error || 'Failed to pull from backroom');
    }
    return response.json();
  },

  async moveOnFloor(data) {
    const response = await fetch(`${API_BASE_URL}/inventory/move-on-floor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to move on floor' }));
      throw new Error(error.error || 'Failed to move on floor');
    }
    return response.json();
  },

  async removeFromFloor(data) {
    const response = await fetch(`${API_BASE_URL}/inventory/remove-from-floor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to remove from floor' }));
      throw new Error(error.error || 'Failed to remove from floor');
    }
    return response.json();
  },

  async auditBackroom(data) {
    const response = await fetch(`${API_BASE_URL}/inventory/audit-backroom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to audit backroom' }));
      throw new Error(error.error || 'Failed to audit backroom');
    }
    return response.json();
  },
};

