# 🐛 Debugging Guide - Frontend & Backend

Complete guide for debugging both the React frontend and Node.js/Fastify backend in Cursor.

---

## 🚀 Quick Start

### Option 1: Use VS Code Debugger (Recommended)

1. **Open the Run and Debug panel** in Cursor:
   - Press `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows/Linux)
   - Or click the "Run and Debug" icon in the sidebar

2. **Select a debug configuration:**
   - **"Debug Backend (Node.js)"** - Debug backend only
   - **"Debug Frontend (Chrome)"** - Debug frontend in Chrome
   - **"Debug Full Stack"** - Debug both simultaneously (best option!)

3. **Click the green play button** or press `F5`

4. **Set breakpoints** by clicking in the gutter (left of line numbers)

---

## 🔧 Backend Debugging

### Method 1: VS Code Debugger (Best)

1. Set breakpoints in `backend/src/**/*.ts` files
2. Select **"Debug Backend (Node.js)"** from the debug dropdown
3. Press `F5` to start
4. Backend runs with hot-reload via `tsx watch`
5. Breakpoints will hit when code executes

### Method 2: Console Logging

Add `console.log()` statements:

```typescript
// backend/src/routes/products.ts
fastify.get('/api/products/upc/:upc', async (request, reply) => {
  console.log('🔍 Scanning UPC:', request.params.upc);
  const product = await ProductService.getByUpc(request.params.upc, true);
  console.log('📦 Product found:', product);
  return reply.send(product);
});
```

**View logs:**
- Terminal running `npm run dev` in `backend/`
- Or check Cursor's integrated terminal

### Method 3: Debugger Statement

Add `debugger;` statements (works with Chrome DevTools):

```typescript
fastify.get('/api/products', async (request, reply) => {
  debugger; // Execution pauses here if debugger is attached
  const products = await ProductService.list();
  return reply.send(products);
});
```

### Method 4: Attach to Running Process

1. Start backend with debug flag:
   ```bash
   cd backend
   node --inspect-brk=9229 -r tsx src/index.ts
   ```

2. In Cursor, select **"Debug Backend (Attach)"**
3. Press `F5`

---

## 🎨 Frontend Debugging

### Method 1: VS Code Debugger + Chrome

1. Start frontend: `cd frontend && npm run dev`
2. In Cursor, select **"Debug Frontend (Chrome)"**
3. Press `F5`
4. Chrome opens with DevTools connected
5. Set breakpoints in `frontend/src/**/*.jsx` files

### Method 2: Browser DevTools (Easiest)

1. **Open your app** in Chrome/Edge: `http://localhost:5173`
2. **Press `F12`** or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. **Use these tabs:**
   - **Console** - See `console.log()` output and errors
   - **Network** - Inspect API requests/responses
   - **Sources** - Set breakpoints, step through code
   - **React DevTools** - Inspect React component state (install extension)

### Method 3: Console Logging

Add `console.log()` in React components:

```javascript
// frontend/src/pages/Scanner.jsx
const handleScan = async (scannedUpc) => {
  console.log('🔍 Scanning:', scannedUpc);
  try {
    const data = await api.getProductByUpc(scannedUpc);
    console.log('✅ Product data:', data);
    setProduct(data);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
```

**View logs:**
- Browser DevTools Console (`F12`)
- Or Cursor's integrated terminal (if using VS Code debugger)

### Method 4: React DevTools

1. **Install React DevTools extension:**
   - Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/

2. **Open DevTools** (`F12`)
3. **Click "Components" tab**
4. **Inspect component state, props, and hooks**

---

## 🔍 Debugging API Calls

### In Browser DevTools:

1. Open **Network tab** (`F12` → Network)
2. Filter by **XHR** or **Fetch**
3. Click any request to see:
   - **Headers** - Request/response headers
   - **Payload** - Request body
   - **Response** - API response data
   - **Timing** - How long request took

### Add Request Logging:

```javascript
// frontend/src/services/api.js
const getProductByUpc = async (upc) => {
  console.log('📡 API Request: GET /api/products/upc/' + upc);
  const response = await fetch(`${API_BASE_URL}/products/upc/${upc}`);
  console.log('📥 API Response:', response.status, response.statusText);
  const data = await response.json();
  console.log('📦 Response data:', data);
  return data;
};
```

---

## 🐛 Common Debugging Scenarios

### 1. API Request Failing

**Check:**
- Network tab → See error status code
- Backend terminal → Check for errors
- Backend logs → `console.log()` in route handler
- CORS errors → Check `backend/src/index.ts` CORS config

**Debug:**
```javascript
// Frontend
try {
  const data = await api.getProductByUpc(upc);
} catch (error) {
  console.error('Full error:', error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
}
```

### 2. State Not Updating

**Check:**
- React DevTools → Inspect component state
- Console → Check for React warnings
- Check if `setState` is being called

**Debug:**
```javascript
useEffect(() => {
  console.log('🔄 State changed:', { product, loading, error });
}, [product, loading, error]);
```

### 3. Database Query Issues

**Check:**
- Backend terminal → Prisma query logs
- Prisma Studio → `cd backend && npm run prisma:studio`
- Add logging in service:

```typescript
// backend/src/services/productService.ts
static async getByUpc(upc: string) {
  console.log('🔍 Querying product with UPC:', upc);
  const product = await prisma.product.findUnique({
    where: { upc },
    include: { /* ... */ }
  });
  console.log('📦 Query result:', product);
  return product;
}
```

### 4. TypeScript Errors

**Check:**
- Cursor's Problems panel (`Cmd+Shift+M`)
- Terminal → Run `cd backend && npm run build`

---

## 🛠️ Debugging Tools

### Backend Tools:

- **Prisma Studio** - Visual database browser
  ```bash
  cd backend
  npm run prisma:studio
  ```
  Opens at `http://localhost:5555`

- **Postman / Insomnia** - Test API endpoints
  - Import your routes
  - Test with different parameters

- **Node Inspector** - Already configured in launch.json

### Frontend Tools:

- **React DevTools** - Component inspector
- **Redux DevTools** - If you add Redux later
- **Lighthouse** - Performance auditing

---

## 📝 Debugging Checklist

When something's not working:

- [ ] Check browser console for errors
- [ ] Check backend terminal for errors
- [ ] Check Network tab for failed requests
- [ ] Verify API URL is correct (`VITE_API_URL`)
- [ ] Check CORS settings
- [ ] Verify database connection (`DATABASE_URL`)
- [ ] Check Prisma migrations are applied
- [ ] Look for TypeScript errors in Problems panel
- [ ] Add `console.log()` at key points
- [ ] Use breakpoints to step through code

---

## 🎯 Pro Tips

1. **Use `console.table()` for arrays:**
   ```javascript
   console.table(products); // Beautiful table view!
   ```

2. **Use `console.group()` for organized logs:**
   ```javascript
   console.group('Product Scan');
   console.log('UPC:', upc);
   console.log('Product:', product);
   console.groupEnd();
   ```

3. **Color-code your logs:**
   ```javascript
   console.log('%c✅ Success!', 'color: green; font-weight: bold');
   console.log('%c❌ Error!', 'color: red; font-weight: bold');
   ```

4. **Use conditional breakpoints:**
   - Right-click breakpoint → Edit Breakpoint
   - Add condition: `upc === "123456789"`

5. **Watch expressions:**
   - In VS Code debugger, add variables to "Watch" panel
   - Monitor values as you step through code

---

## 🚨 Quick Fixes

### Backend won't start:
```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

### Frontend won't start:
```bash
cd frontend
npm install
npm run dev
```

### Can't connect to API:
- Check `VITE_API_URL` in `frontend/.env`
- Verify backend is running on port 3000
- Check CORS in `backend/src/index.ts`

### Database connection error:
- Check `DATABASE_URL` in `backend/.env`
- Run migrations: `cd backend && npm run prisma:migrate`

---

## 📚 Resources

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)

---

**Happy Debugging! 🐛→✅**

