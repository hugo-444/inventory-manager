// Use environment variable or detect if on mobile network
const getApiBaseUrl = () => {
  // PRIORITY 1: Environment variable (always use if set - required for ngrok/Railway)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Normalize: remove trailing slash, ensure /api is present
    let normalized = envUrl.trim();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    if (!normalized.endsWith('/api')) {
      normalized = normalized + '/api';
    }
    return normalized;
  }
  
  // PRIORITY 2: Auto-detect for local network access (same hostname, different device)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If not localhost, use the same hostname for API (for phone/tablet on same network)
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('ngrok') && !hostname.includes('railway')) {
      const protocol = window.location.protocol;
      const port = protocol === 'https:' ? '' : ':3000';
      return `${protocol}//${hostname}${port}/api`;
    }
  }
  
  // PRIORITY 3: Default to localhost for development
  return 'http://localhost:3000/api';
};

// Export for direct fetch calls (returns base URL without /api)
export const getApiBaseUrlForFetch = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Check if we're on HTTPS (ngrok/Railway deployment)
      const protocol = window.location.protocol;
      const port = protocol === 'https:' ? '' : ':3000';
      return `${protocol}//${hostname}${port}`;
    }
  }
  
  // Use environment variable if set
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Remove /api if present, remove trailing slash
    let normalized = envUrl.replace(/\/api\/?$/, '').trim();
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }
  
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

// Log API URL for debugging (only in development)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}

// Helper to parse response and handle errors
const parseResponse = async (response, defaultError = 'Request failed') => {
  console.log('🔍 parseResponse called:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    url: response.url
  });
  
  const contentType = response.headers.get('content-type') || '';
  console.log('📋 Content-Type:', contentType);
  
  // First, try to get the text to check what we actually received
  let text;
  try {
    text = await response.text();
    console.log('📄 Response text length:', text.length);
    console.log('📄 Response text preview (first 500 chars):', text.substring(0, 500));
  } catch (textError) {
    console.error('❌ Failed to read response text:', textError);
    throw new Error('Failed to read response body: ' + textError.message);
  }
  
  // Check if it's ngrok's interstitial page (must check before JSON parsing)
  if (text.includes('ngrok') || text.includes('You are about to visit') || text.includes('ngrok-free.dev')) {
    console.error('🚫 ngrok interstitial page detected');
    throw new Error('ngrok interstitial page detected. Please visit the backend URL directly in your browser first to bypass the warning page, then refresh this page.');
  }
  
  // Check if it's an HTML error page
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html') || text.trim().startsWith('<HTML')) {
    console.error('🚫 HTML response received:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      contentType,
      preview: text.substring(0, 300)
    });
    
    if (response.status === 404) {
      throw new Error(`API endpoint not found: ${response.url}. Please verify the backend is running and the API URL is correct.`);
    }
    throw new Error(`Server returned HTML instead of JSON. This usually means the backend is not accessible at ${response.url}. Check if the backend is running and the API URL is correct.`);
  }
  
  // Try to parse as JSON (even if Content-Type is wrong, the body might still be JSON)
  console.log('🔄 Attempting to parse as JSON...');
  try {
    const data = JSON.parse(text);
    console.log('✅ JSON parsed successfully:', {
      type: Array.isArray(data) ? 'array' : typeof data,
      length: Array.isArray(data) ? data.length : 'N/A',
      keys: !Array.isArray(data) && typeof data === 'object' ? Object.keys(data) : 'N/A'
    });
    
    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, data);
      throw new Error(data.error || defaultError);
    }
    
    console.log('✅ parseResponse returning data');
    return data;
  } catch (parseError) {
    // If JSON parsing fails, it's not valid JSON
    console.error('❌ Failed to parse JSON:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      contentType,
      textLength: text.length,
      preview: text.substring(0, 500),
      parseError: parseError.message,
      parseErrorStack: parseError.stack
    });
    
    if (!response.ok) {
      throw new Error(`${defaultError} (${response.status} ${response.statusText})`);
    }
    
    throw new Error('Invalid response format from server - expected JSON but received: ' + (contentType || 'unknown content type'));
  }
};

// Helper to build API URL (handles trailing slashes and prevents double slashes)
const buildApiUrl = (path) => {
  // Remove trailing slashes from base
  let base = API_BASE_URL.trim();
  while (base.endsWith('/')) {
    base = base.slice(0, -1);
  }
  
  // Ensure path starts with exactly one slash
  let cleanPath = path.trim();
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  // Combine and ensure no double slashes (except after protocol)
  const url = base + cleanPath;
  return url.replace(/([^:]\/)\/+/g, '$1');
};

export const api = {
  // Products
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? buildApiUrl(`/products?${query}`) : buildApiUrl('/products');
    console.log('📡 API Request:', url);
    const response = await fetch(url);
    console.log('📥 API Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      url: response.url
    });
    const data = await parseResponse(response, 'Failed to fetch products');
    console.log('✅ Parsed data:', Array.isArray(data) ? `${data.length} products` : typeof data);
    if (Array.isArray(data) && data.length > 0) {
      console.log('📦 First product sample:', {
        id: data[0].id,
        name: data[0].name,
        upc: data[0].upc,
        hasStyle: !!data[0].style,
        hasDepartment: !!data[0].department,
        salesStockCount: data[0].salesStock?.length || 0,
        backStockCount: data[0].backStock?.length || 0
      });
    }
    return data;
  },

  async getProductById(id) {
    const response = await fetch(buildApiUrl(`/products/${id}`));
    return parseResponse(response, 'Failed to fetch product');
  },

  async getProductByUpc(upc) {
    const response = await fetch(buildApiUrl(`/products/upc/${upc}`));
    return parseResponse(response, 'Product not found');
  },

  async createProduct(product) {
    const response = await fetch(buildApiUrl('/products'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return parseResponse(response, 'Failed to create product');
  },

  async updateProduct(id, product) {
    const response = await fetch(buildApiUrl(`/products/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    return parseResponse(response, 'Failed to update product');
  },

  async getUnconfiguredProducts() {
    const response = await fetch(buildApiUrl('/products?status=UNCONFIGURED'));
    return parseResponse(response, 'Failed to fetch unconfigured products');
  },

  // Styles
  async getStyles() {
    const response = await fetch(buildApiUrl('/styles'));
    return parseResponse(response, 'Failed to fetch styles');
  },

  // Locations
  async getBackroomLocations() {
    const response = await fetch(buildApiUrl('/locations/backroom'));
    return parseResponse(response, 'Failed to fetch backroom locations');
  },

  async getLocationByCode(code) {
    const response = await fetch(buildApiUrl(`/locations/${code}`));
    return parseResponse(response, 'Location not found');
  },

  async getLocationProducts(code) {
    const response = await fetch(buildApiUrl(`/locations/${code}/products`));
    return parseResponse(response, 'Failed to fetch location products');
  },

  async getSalesFloorLocations() {
    const response = await fetch(buildApiUrl('/locations/sales-floor'));
    return parseResponse(response, 'Failed to fetch sales floor locations');
  },

  async createBackroomLocation(data) {
    const response = await fetch(buildApiUrl('/locations/backroom'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to create backroom location');
  },

  async createSalesFloorLocation(data) {
    const response = await fetch(buildApiUrl('/locations/sales-floor'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to create sales floor location');
  },

  async getDepartments() {
    const response = await fetch(buildApiUrl('/locations/departments'));
    return parseResponse(response, 'Failed to fetch departments');
  },

  async getParentFixtures(departmentId) {
    const query = departmentId ? `?departmentId=${departmentId}` : '';
    const response = await fetch(buildApiUrl(`/locations/parent-fixtures${query}`));
    return parseResponse(response, 'Failed to fetch parent fixtures');
  },

  // Inventory Movements
  async getMovements(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? buildApiUrl(`/inventory/movements?${query}`) : buildApiUrl('/inventory/movements');
    const response = await fetch(url);
    return parseResponse(response, 'Failed to fetch movements');
  },

  async placeInBack(data) {
    const response = await fetch(buildApiUrl('/inventory/place-in-back'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to place in backroom');
  },

  async placeOnFloor(data) {
    const response = await fetch(buildApiUrl('/inventory/place-on-floor'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to place on floor');
  },

  async pullFromBack(data) {
    const response = await fetch(buildApiUrl('/inventory/pull-from-back'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to pull from backroom');
  },

  async moveOnFloor(data) {
    const response = await fetch(buildApiUrl('/inventory/move-on-floor'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to move on floor');
  },

  async removeFromFloor(data) {
    const response = await fetch(buildApiUrl('/inventory/remove-from-floor'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to remove from floor');
  },

  async auditBackroom(data) {
    const response = await fetch(buildApiUrl('/inventory/audit-backroom'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse(response, 'Failed to audit backroom');
  },
};

