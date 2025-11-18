# Debug: Products Page Data Flow

## Complete Flow Trace

### 1. Frontend → API Service
**File:** `frontend/src/pages/Products.jsx` (line 75)
```javascript
const data = await api.getProducts(params);
```

**File:** `frontend/src/services/api.js` (line 105-113)
```javascript
async getProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? buildApiUrl(`/products?${query}`) : buildApiUrl('/products');
  console.log('📡 API Request:', url);  // DEBUG: Check this URL
  const response = await fetch(url);
  console.log('📥 API Response status:', response.status);  // DEBUG: Check status
  const data = await parseResponse(response, 'Failed to fetch products');
  console.log('✅ Parsed data:', Array.isArray(data) ? `${data.length} products` : typeof data);
  return data;
}
```

**Expected URL:** 
- Local: `http://localhost:3000/api/products`
- ngrok: `https://your-backend-ngrok-url.ngrok.io/api/products`
- Railway: `https://your-backend.railway.app/api/products`

---

### 2. API Service → Backend Route
**File:** `backend/src/routes/products.ts` (line 40-63)
```typescript
fastify.get('/api/products', async (request, reply) => {
  const products = await ProductService.list({
    skip: request.query.skip ? parseInt(request.query.skip, 10) : undefined,
    take: request.query.take ? parseInt(request.query.take, 10) : undefined,
    styleId: request.query.styleId,
    departmentId: request.query.departmentId,
    variantId: request.query.variantId,
    status: request.query.status,
    q: request.query.q,
  });
  return reply.send(products);
});
```

**Route:** `GET /api/products`
**Query Params:** `departmentId`, `styleId`, `status`, `variantId`, `q`, `skip`, `take`

---

### 3. Backend Route → Service
**File:** `backend/src/services/productService.ts` (line 121-164)
```typescript
static async list(options?: {
  skip?: number;
  take?: number;
  styleId?: string;
  departmentId?: string;
  variantId?: string;
  status?: string;
  q?: string;
}): Promise<Product[]> {
  // ... builds where clause ...
  
  return prisma.product.findMany({
    where,
    skip: options?.skip,
    take: options?.take || 100,
    include: {
      style: true,
      variant: true,
      department: true,
      salesStock: { include: { location: true } },  // ✅ INCLUDED
      backStock: { include: { location: true } },   // ✅ INCLUDED
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

**Returns:** Array of Product objects with:
- `salesStock[]` - Array of sales floor stock records
- `backStock[]` - Array of backroom stock records
- `style` - Style object (or null)
- `variant` - Variant object (or null)
- `department` - Department object (or null)

---

### 4. Frontend Processing
**File:** `frontend/src/pages/Products.jsx` (line 64-105)

1. **Calls API:** `api.getProducts(params)`
2. **Receives:** Array of products
3. **Validates:** Checks if array
4. **Filters:** Applies price filters client-side
5. **Sets State:** `setProducts(filtered)` and `setFilteredProducts(filtered)`

**Stock Calculation:** (line 118-122)
```javascript
const getTotalStock = (product) => {
  const backroomStock = product.backStock?.reduce((sum, s) => sum + s.qty, 0) || 0;
  const salesStock = product.salesStock?.reduce((sum, s) => sum + s.qty, 0) || 0;
  return backroomStock + salesStock;
};
```

**Rendering:** (line 487-541)
- Maps over `filteredProducts`
- Calculates `totalStock` for each product
- Renders product cards

---

## Common Issues & Fixes

### Issue 1: API URL Wrong (ngrok)
**Symptom:** HTML response instead of JSON
**Fix:** Set `VITE_API_URL` in `frontend/.env`:
```
VITE_API_URL=https://your-backend-ngrok-url.ngrok.io/api
```

### Issue 2: CORS Error
**Symptom:** Network error, blocked request
**Fix:** Backend CORS is configured to allow all origins (line 14-17 in `backend/src/index.ts`)

### Issue 3: Empty Array
**Symptom:** "No products found" but backend has products
**Fix:** Check if filters are too restrictive, check console logs

### Issue 4: Data Structure Mismatch
**Symptom:** `product.backStock is undefined`
**Fix:** Backend includes `backStock` and `salesStock` - verify API response in console

---

## Debug Checklist

1. ✅ **Check Console Logs:**
   - `🔗 API Base URL:` - Should show correct URL
   - `📡 API Request:` - Should show full URL being called
   - `📥 API Response status:` - Should be 200
   - `✅ Parsed data:` - Should show number of products
   - `🔍 Loading products with params:` - Should show filter params
   - `✅ Products loaded:` - Should show count

2. ✅ **Check Network Tab:**
   - Open DevTools → Network tab
   - Filter by "XHR" or "Fetch"
   - Look for `/api/products` request
   - Check:
     - Status code (should be 200)
     - Response headers (should be `application/json`)
     - Response body (should be JSON array)

3. ✅ **Verify Backend:**
   ```bash
   curl http://localhost:3000/api/products
   # Should return JSON array
   ```

4. ✅ **Check Data Structure:**
   - Products should have `backStock[]` and `salesStock[]` arrays
   - Each stock item should have `qty` property
   - Products should have `name`, `upc`, `price`, `status`

---

## Quick Test

Open browser console and check:
1. `🔗 API Base URL:` - Is it correct?
2. `📡 API Request:` - Is the URL correct?
3. `📥 API Response status:` - Is it 200?
4. `✅ Parsed data:` - How many products?
5. `✅ Products loaded:` - Does it match?

If any step fails, that's where the issue is!

