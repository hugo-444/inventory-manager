import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import ProductEditModal from '../components/ProductEditModal';
import './Products.css';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionData, setActionData] = useState({ locationCode: '', qty: '', notes: '' });
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    departmentId: '',
    styleId: '',
    status: '',
    minPrice: '',
    maxPrice: '',
  });
  const [departments, setDepartments] = useState([]);
  const [styles, setStyles] = useState([]);

  const loadFilterData = async () => {
    try {
      const [depts, stls] = await Promise.all([
        api.getDepartments(),
        api.getStyles(),
      ]);
      setDepartments(depts);
      setStyles(stls);
    } catch (err) {
      console.error('Failed to load filter data:', err);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.upc || '').includes(searchQuery) ||
          (p.style?.styleCode && p.style.styleCode.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const loadProducts = async () => {
    console.log('🚀 loadProducts called - fetching all products');
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Calling api.getProducts() with no params...');
      const data = await api.getProducts();
      
      console.log('✅ api.getProducts returned:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'N/A'
      });
      
      // Validate data structure
      if (!Array.isArray(data)) {
        console.error('❌ Invalid data format - expected array, got:', typeof data, data);
        throw new Error('Invalid response format: expected array of products');
      }
      
      console.log('✅ Data is array with', data.length, 'products');
      if (data.length > 0) {
        console.log('📦 First product sample:', data[0]);
      }
      
      console.log('💾 Setting products state...');
      // Ensure we always set an array
      const productsArray = Array.isArray(data) ? data : [];
      setProducts(productsArray);
      setFilteredProducts(productsArray);
      console.log('✅ Products state updated with', productsArray.length, 'products');
    } catch (err) {
      console.error('❌ Failed to load products - Full error:', {
        message: err.message,
        stack: err.stack,
        error: err
      });
      setError('Failed to load products: ' + (err.message || 'Unknown error'));
      showNotification('Failed to load products: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      console.log('🏁 loadProducts finally block - setting loading to false');
      setLoading(false);
    }
  };

  // Load products and filter data on mount
  useEffect(() => {
    loadProducts();
    loadFilterData();
  }, []);

  const getTotalStock = (product) => {
    if (!product) return 0;
    const backroomStock = Array.isArray(product.backStock) 
      ? product.backStock.reduce((sum, s) => sum + (s?.qty || 0), 0) 
      : 0;
    const salesStock = Array.isArray(product.salesStock) 
      ? product.salesStock.reduce((sum, s) => sum + (s?.qty || 0), 0) 
      : 0;
    return backroomStock + salesStock;
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleAction = (type) => {
    setActionType(type);
    setActionData({ locationCode: '', qty: '', notes: '', fromLocationCode: '', toLocationCode: '' });
    setShowActionModal(true);
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setActionLoading(true);
    try {
      const qty = parseInt(actionData.qty, 10);
      if (isNaN(qty) || qty <= 0) {
        showNotification('Quantity must be a positive number', 'error');
        setActionLoading(false);
        return;
      }

      let result;
      switch (actionType) {
        case 'place-in-back':
          if (!actionData.locationCode.trim()) {
            showNotification('Location code is required', 'error');
            setActionLoading(false);
            return;
          }
          result = await api.placeInBack({
            productId: selectedProduct.id,
            backroomLocationCode: actionData.locationCode.trim(),
            qty,
            notes: actionData.notes || undefined,
          });
          showNotification(`Placed ${qty} units in backroom location ${actionData.locationCode}`, 'success');
          break;

        case 'place-on-floor':
          if (!actionData.locationCode.trim()) {
            showNotification('Location code is required', 'error');
            setActionLoading(false);
            return;
          }
          result = await api.placeOnFloor({
            productId: selectedProduct.id,
            salesFloorLocationCode: actionData.locationCode.trim(),
            qty,
            notes: actionData.notes || undefined,
          });
          showNotification(`Placed ${qty} units on sales floor location ${actionData.locationCode}`, 'success');
          break;

        case 'pull-from-back':
          if (!actionData.locationCode.trim()) {
            showNotification('Location code is required', 'error');
            setActionLoading(false);
            return;
          }
          result = await api.pullFromBack({
            productId: selectedProduct.id,
            backroomLocationCode: actionData.locationCode.trim(),
            qty,
            notes: actionData.notes || undefined,
          });
          showNotification(`Pulled ${qty} units from backroom location ${actionData.locationCode}`, 'success');
          break;

        case 'move-on-floor':
          if (!actionData.fromLocationCode.trim() || !actionData.toLocationCode.trim()) {
            showNotification('Both from and to locations are required', 'error');
            setActionLoading(false);
            return;
          }
          result = await api.moveOnFloor({
            productId: selectedProduct.id,
            fromSalesFloorLocationCode: actionData.fromLocationCode.trim(),
            toSalesFloorLocationCode: actionData.toLocationCode.trim(),
            qty,
            notes: actionData.notes || undefined,
          });
          showNotification(`Moved ${qty} units from ${actionData.fromLocationCode} to ${actionData.toLocationCode}`, 'success');
          break;

        case 'remove-from-floor':
          if (!actionData.locationCode.trim()) {
            showNotification('Location code is required', 'error');
            setActionLoading(false);
            return;
          }
          result = await api.removeFromFloor({
            productId: selectedProduct.id,
            salesFloorLocationCode: actionData.locationCode.trim(),
            qty,
            notes: actionData.notes || undefined,
          });
          showNotification(`Removed ${qty} units from sales floor location ${actionData.locationCode}`, 'success');
          break;

        case 'audit-backroom':
          if (!actionData.locationCode.trim()) {
            showNotification('Location code is required', 'error');
            setActionLoading(false);
            return;
          }
          result = await api.auditBackroom({
            productId: selectedProduct.id,
            backroomLocationCode: actionData.locationCode.trim(),
            actualQty: qty,
            notes: actionData.notes || undefined,
          });
          showNotification(`Audited backroom location ${actionData.locationCode}: ${qty} units`, 'success');
          break;

        default:
          showNotification('Unknown action type', 'error');
          setActionLoading(false);
          return;
      }

      setShowActionModal(false);
      setActionData({ locationCode: '', qty: '', notes: '', fromLocationCode: '', toLocationCode: '' });
      
      // Reload product to get updated stock
      const updatedProduct = await api.getProductById(selectedProduct.id);
      setSelectedProduct(updatedProduct);
      
      // Reload products list
      await loadProducts();
    } catch (err) {
      showNotification(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;
  if (error) {
    return (
      <div className="products-page">
        <h1 className="page-title">Products</h1>
        <div className="error-message" style={{ padding: '1rem', margin: '1rem 0' }}>
          {error}
          <div style={{ marginTop: '0.5rem', fontSize: '14px', color: '#666' }}>
            Check browser console for details. Verify backend is running at the correct URL.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <h1 className="page-title">Products</h1>

      {/* Filters */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem', 
        background: '#f9fafb', 
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '1rem',
          marginBottom: '0.5rem'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: 600, 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Department
            </label>
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                border: '1px solid #d1d5db',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">All Departments</option>
              {Array.isArray(departments) && departments.map(dept => (
                dept && dept.id ? (
                  <option key={dept.id} value={dept.id}>{dept.name || 'Unnamed'}</option>
                ) : null
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: 600, 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Style
            </label>
            <select
              value={filters.styleId}
              onChange={(e) => setFilters({ ...filters, styleId: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                border: '1px solid #d1d5db',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">All Styles</option>
              {Array.isArray(styles) && styles.map(style => (
                style && style.id ? (
                  <option key={style.id} value={style.id}>{style.name || 'Unnamed'} ({style.styleCode || 'N/A'})</option>
                ) : null
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: 600, 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                border: '1px solid #d1d5db',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="UNCONFIGURED">Unconfigured</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: 600, 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Min Price
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              placeholder="0.00"
              step="0.01"
              min="0"
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '12px', 
              fontWeight: 600, 
              marginBottom: '0.25rem',
              color: '#374151'
            }}>
              Max Price
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              placeholder="999.99"
              step="0.01"
              min="0"
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                borderRadius: '6px', 
                border: '1px solid #d1d5db',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => {
                setFilters({ departmentId: '', styleId: '', status: '', minPrice: '', maxPrice: '' });
                setSearchQuery('');
              }}
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                width: '100%'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="search-form">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search by name, UPC, or style..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </form>

      <div className="products-list">
        {filteredProducts.length === 0 && !loading ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: '#6b7280',
            fontSize: '14px'
          }}>
            <p>No products found.</p>
            {products.length === 0 && (
              <p style={{ marginTop: '0.5rem', fontSize: '12px' }}>
                Try adding a product or check if the backend is connected.
              </p>
            )}
          </div>
        ) : (
          Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              if (!product || !product.id) return null;
              const totalStock = getTotalStock(product);
              return (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                  }}
                >
                  <div className="product-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"></rect>
                      <path d="M3 9h18M9 21V9" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name || 'Unnamed Product'}</h3>
                    <p className="product-id">{product.upc || 'No UPC'}</p>
                    {product.status === 'UNCONFIGURED' && (
                      <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>⚠️ Needs Configuration</span>
                    )}
                    <div className="product-meta">
                      <span className="product-price">
                        {product.price !== null && product.price !== undefined ? `$${product.price}` : 'Price TBD'}
                      </span>
                      <span className={`stock-badge ${totalStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                        {totalStock} in stock
                      </span>
                    </div>
                  </div>
                  <svg className="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2"></path>
                  </svg>
                </div>
              );
            })
          ) : null
        )}
      </div>

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={selectedProduct?.name || 'Product Details'}
      >
        {selectedProduct && (
          <>
            <div className="modal-section">
              <div className="modal-field">
                <span className="modal-field-label">UPC</span>
                <div className="modal-field-value">{selectedProduct.upc}</div>
              </div>
              <div className="modal-field">
                <span className="modal-field-label">Price</span>
                <div className="modal-field-value">
                  {selectedProduct.price !== null && selectedProduct.price !== undefined 
                    ? `$${selectedProduct.price}` 
                    : 'Not set'}
                </div>
              </div>
              {selectedProduct.status && (
                <div className="modal-field">
                  <span className="modal-field-label">Status</span>
                  <div className="modal-field-value">
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: selectedProduct.status === 'ACTIVE' ? '#d1fae5' : 
                                      selectedProduct.status === 'UNCONFIGURED' ? '#fef3c7' :
                                      selectedProduct.status === 'DISCONTINUED' ? '#fee2e2' : '#e5e7eb',
                      color: selectedProduct.status === 'ACTIVE' ? '#065f46' :
                             selectedProduct.status === 'UNCONFIGURED' ? '#92400e' :
                             selectedProduct.status === 'DISCONTINUED' ? '#991b1b' : '#374151'
                    }}>
                      {selectedProduct.status}
                    </span>
                  </div>
                </div>
              )}
              {selectedProduct.color && (
                <div className="modal-field">
                  <span className="modal-field-label">Color</span>
                  <div className="modal-field-value">{selectedProduct.color}</div>
                </div>
              )}
              {selectedProduct.size && (
                <div className="modal-field">
                  <span className="modal-field-label">Size</span>
                  <div className="modal-field-value">{selectedProduct.size}</div>
                </div>
              )}
              {selectedProduct.style && (
                <div className="modal-field">
                  <span className="modal-field-label">Style</span>
                  <div className="modal-field-value">
                    {selectedProduct.style.name || 'N/A'} ({selectedProduct.style.styleCode || 'N/A'})
                  </div>
                </div>
              )}
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Stock Locations</h3>
              {Array.isArray(selectedProduct.backStock) && selectedProduct.backStock.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>Backroom</h4>
                  <div className="modal-stock-list">
                    {selectedProduct.backStock.map((stock) => (
                      stock && stock.id ? (
                        <div key={stock.id} className="modal-stock-item">
                          <span className="modal-stock-location">{stock.location?.locationCode || 'Unknown'}</span>
                          <span className="modal-stock-qty">{stock.qty || 0} units</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(selectedProduct.salesStock) && selectedProduct.salesStock.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>Sales Floor</h4>
                  <div className="modal-stock-list">
                    {selectedProduct.salesStock.map((stock) => (
                      stock && stock.id ? (
                        <div key={stock.id} className="modal-stock-item">
                          <span className="modal-stock-location">{stock.location?.locationCode || 'Unknown'}</span>
                          <span className="modal-stock-qty">{stock.qty || 0} units</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
              {(!Array.isArray(selectedProduct.backStock) || selectedProduct.backStock.length === 0) &&
                (!Array.isArray(selectedProduct.salesStock) || selectedProduct.salesStock.length === 0) && (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No stock assigned to locations</p>
                )}
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="modal-btn modal-btn-primary"
                  onClick={() => setShowEditModal(true)}
                  style={{ width: '100%', backgroundColor: '#10b981' }}
                >
                  ✏️ Edit Product
                </button>
                <button
                  className="modal-btn modal-btn-primary"
                  onClick={() => handleAction('place-in-back')}
                  style={{ width: '100%' }}
                >
                  Place in Backroom
                </button>
                <button
                  className="modal-btn modal-btn-primary"
                  onClick={() => handleAction('place-on-floor')}
                  style={{ width: '100%' }}
                >
                  Place on Sales Floor
                </button>
                <button
                  className="modal-btn modal-btn-secondary"
                  onClick={() => handleAction('pull-from-back')}
                  style={{ width: '100%' }}
                >
                  Pull from Backroom
                </button>
                <button
                  className="modal-btn modal-btn-secondary"
                  onClick={() => handleAction('move-on-floor')}
                  style={{ width: '100%' }}
                >
                  Move on Sales Floor
                </button>
                <button
                  className="modal-btn modal-btn-secondary"
                  onClick={() => handleAction('remove-from-floor')}
                  style={{ width: '100%' }}
                >
                  Remove from Sales Floor
                </button>
                <button
                  className="modal-btn modal-btn-secondary"
                  onClick={() => handleAction('audit-backroom')}
                  style={{ width: '100%' }}
                >
                  Audit Backroom Location
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setActionData({ locationCode: '', qty: '', notes: '', fromLocationCode: '', toLocationCode: '' });
        }}
        title={
          actionType === 'place-in-back' ? 'Place in Backroom' :
          actionType === 'place-on-floor' ? 'Place on Sales Floor' :
          actionType === 'pull-from-back' ? 'Pull from Backroom' :
          actionType === 'move-on-floor' ? 'Move on Sales Floor' :
          actionType === 'remove-from-floor' ? 'Remove from Sales Floor' :
          actionType === 'audit-backroom' ? 'Audit Backroom' :
          'Inventory Action'
        }
      >
        <form onSubmit={handleActionSubmit}>
          {actionType === 'move-on-floor' ? (
            <>
              <div className="modal-form-group">
                <label className="modal-form-label">From Location Code</label>
                <input
                  type="text"
                  className="modal-form-input"
                  placeholder="e.g., FashMT02(99)"
                  value={actionData.fromLocationCode}
                  onChange={(e) => setActionData({ ...actionData, fromLocationCode: e.target.value })}
                  required
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Sales floor location code (e.g., FashMT02(99))
                </p>
              </div>
              <div className="modal-form-group">
                <label className="modal-form-label">To Location Code</label>
                <input
                  type="text"
                  className="modal-form-input"
                  placeholder="e.g., FashMT02(2)"
                  value={actionData.toLocationCode}
                  onChange={(e) => setActionData({ ...actionData, toLocationCode: e.target.value })}
                  required
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Sales floor location code (e.g., FashMT02(2))
                </p>
              </div>
            </>
          ) : actionType === 'audit-backroom' ? (
            <div className="modal-form-group">
              <label className="modal-form-label">Backroom Location Code</label>
              <input
                type="text"
                className="modal-form-input"
                placeholder="e.g., 04C12"
                value={actionData.locationCode}
                onChange={(e) => setActionData({ ...actionData, locationCode: e.target.value })}
                required
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Backroom location code (e.g., 04C12 or O4TT88)
              </p>
              <div className="modal-form-group" style={{ marginTop: '16px' }}>
                <label className="modal-form-label">Actual Quantity</label>
                <input
                  type="number"
                  className="modal-form-input"
                  placeholder="0"
                  min="0"
                  value={actionData.qty}
                  onChange={(e) => setActionData({ ...actionData, qty: e.target.value })}
                  required
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  The actual quantity found at this location
                </p>
              </div>
            </div>
          ) : (
            <div className="modal-form-group">
              <label className="modal-form-label">
                {actionType === 'place-in-back' || actionType === 'pull-from-back' ? 'Backroom' : 'Sales Floor'} Location Code
              </label>
              <input
                type="text"
                className="modal-form-input"
                placeholder={
                  actionType === 'place-in-back' || actionType === 'pull-from-back' 
                    ? 'e.g., 04C12 or O4TT88' 
                    : 'e.g., FashMT02(99)'
                }
                value={actionData.locationCode}
                onChange={(e) => setActionData({ ...actionData, locationCode: e.target.value })}
                required
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {actionType === 'place-in-back' || actionType === 'pull-from-back'
                  ? 'Backroom: 04C12 (aisle 4, column C, bay 12) or O4TT88 (overflow)'
                  : 'Sales Floor: FashMT02(99) (department + fixture + section)'}
              </p>
            </div>
          )}

          {actionType !== 'audit-backroom' && (
            <div className="modal-form-group">
              <label className="modal-form-label">Quantity</label>
              <input
                type="number"
                className="modal-form-input"
                placeholder="1"
                min="1"
                value={actionData.qty}
                onChange={(e) => setActionData({ ...actionData, qty: e.target.value })}
                required
              />
            </div>
          )}

          <div className="modal-form-group">
            <label className="modal-form-label">Notes (optional)</label>
            <textarea
              className="modal-form-input"
              placeholder="Add any notes about this action..."
              rows="3"
              value={actionData.notes}
              onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={() => {
                setShowActionModal(false);
                setActionData({ locationCode: '', qty: '', notes: '', fromLocationCode: '', toLocationCode: '' });
              }}
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}


      <ProductEditModal
        product={selectedProduct}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={async (updatedProduct) => {
          setSelectedProduct(updatedProduct);
          showNotification('Product updated successfully!', 'success');
          await loadProducts();
          setShowProductModal(true);
        }}
      />
    </div>
  );
}

