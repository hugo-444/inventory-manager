import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScanType, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { api } from '../services/api';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import ProductEditModal from '../components/ProductEditModal';
import './Scanner.css';

export default function Scanner() {
  const [upc, setUpc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionData, setActionData] = useState({ locationCode: '', qty: '', notes: '', fromLocationCode: '', toLocationCode: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scannerElementRef = useRef(null);

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
    if (!product) return;

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
            productId: product.id,
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
            productId: product.id,
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
            productId: product.id,
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
            productId: product.id,
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
            productId: product.id,
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
            productId: product.id,
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
      const updatedProduct = await api.getProductById(product.id);
      setProduct(updatedProduct);
    } catch (err) {
      showNotification(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScan = async (scannedUpc) => {
    if (!scannedUpc.trim()) {
      showNotification('Please enter a UPC code', 'error');
      return;
    }

    // Stop scanning if active
    if (isScanning && html5QrCodeRef.current) {
      stopScanning();
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.getProductByUpc(scannedUpc.trim());
      setProduct(data);
      setUpc(scannedUpc.trim());
      
      // Auto-open edit modal if product needs configuration (new/unknown product)
      if (data.needsConfiguration || data.status === 'UNCONFIGURED') {
        setShowProductModal(false); // Don't show product details modal
        setShowEditModal(true); // Open edit/configure modal immediately
        showNotification('New product detected! Please configure it.', 'warning');
      } else {
        setShowProductModal(true);
        showNotification('Product found!', 'success');
      }
    } catch (err) {
      setError('Product not found');
      setProduct(null);
      showNotification(err.message || 'Product not found', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startScanning = async () => {
    try {
      setCameraError(null);
      setIsScanning(true);
      
      // Check if we're on HTTPS (required for camera)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Camera requires HTTPS. Please access via HTTPS URL.');
      }

      // Wait for DOM to update and element to be available
      // Use a small delay to ensure React has rendered the element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if element exists (try both ref and getElementById)
      const element = scannerElementRef.current || document.getElementById('scanner-reader');
      if (!element) {
        throw new Error('Scanner element not found. Please try again.');
      }

      const elementId = element.id || 'scanner-reader';
      const html5QrCode = new Html5Qrcode(elementId);
      html5QrCodeRef.current = html5QrCode;

      // Get available cameras with better error handling
      let devices;
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (err) {
        console.error('Camera enumeration error:', err);
        throw new Error('Failed to access camera. Please grant camera permissions and ensure you\'re using HTTPS.');
      }

      if (!devices || devices.length === 0) {
        throw new Error('No cameras found on this device');
      }

      // Use back camera if available, otherwise use first camera
      const cameraId = devices.find(d => 
        d.label.toLowerCase().includes('back') || 
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      )?.id || devices[0].id;
      
      console.log('Starting camera with device:', devices.find(d => d.id === cameraId)?.label || cameraId);
      
      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          formatsToSupport: [
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
        },
        (decodedText) => {
          // Successfully scanned a barcode
          console.log('Barcode scanned:', decodedText);
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen frequently while scanning)
          // Only log if it's not a common "not found" error
          if (!errorMessage.includes('NotFoundException') && !errorMessage.includes('No MultiFormat Readers')) {
            console.debug('Scan error:', errorMessage);
          }
        }
      );
    } catch (err) {
      console.error('Camera error:', err);
      const errorMessage = err.message || 'Failed to access camera';
      setCameraError(errorMessage);
      setIsScanning(false);
      
      // More helpful error messages
      if (errorMessage.includes('HTTPS')) {
        showNotification('Camera requires HTTPS. Railway deployment provides this automatically.', 'error');
      } else if (errorMessage.includes('permission')) {
        showNotification('Please grant camera permissions in your browser settings.', 'error');
      } else {
        showNotification('Camera error: ' + errorMessage, 'error');
      }
    }
  };

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      }
      setIsScanning(false);
      setCameraError(null);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (upc.trim()) {
      handleScan(upc.trim());
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showNotification('Please enter a search term', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const products = await api.getProducts();
      const found = products.find(
        (p) =>
          (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.upc || '').includes(searchQuery) ||
          (p.style?.styleCode || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (found) {
        setProduct(found);
        setUpc(found.upc);
        setShowProductModal(true);
        showNotification('Product found!', 'success');
      } else {
        setError('No products found');
        setProduct(null);
        showNotification('No products found matching your search', 'warning');
      }
    } catch (err) {
      setError('Search failed');
      showNotification('Search failed: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scanner-page">
      <h1 className="page-title">Scanner</h1>

      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search products by name, style, or UPC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </form>

      <div className="scanner-view">
        {!isScanning ? (
          <div className="scanner-placeholder">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: '#9ca3af', marginBottom: '1rem' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"></rect>
              <path d="M9 9h6M9 15h6" strokeWidth="2"></path>
            </svg>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Camera scanner ready</p>
            <button
              onClick={startScanning}
              className="scanner-start-btn"
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
                maxWidth: '300px',
              }}
            >
              📷 Start Camera Scanner
            </button>
            {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && (
              <p style={{ 
                marginTop: '1rem', 
                fontSize: '12px', 
                color: '#ef4444',
                textAlign: 'center',
                maxWidth: '300px'
              }}>
                ⚠️ Camera requires HTTPS. Use Railway deployment for full functionality.
              </p>
            )}
          </div>
        ) : (
          <div className="scanner-active">
            <div 
              id="scanner-reader" 
              ref={scannerElementRef}
              style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}
            ></div>
            {cameraError && (
              <div className="error-message" style={{ marginTop: '1rem' }}>
                {cameraError}
              </div>
            )}
            <button
              onClick={stopScanning}
              className="scanner-stop-btn"
              style={{
                marginTop: '1rem',
                padding: '12px 24px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Stop Scanning
            </button>
          </div>
        )}
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      {product && (
        <div className="product-result" onClick={() => setShowProductModal(true)} style={{ cursor: 'pointer' }}>
          <h3>{product.name || ''}</h3>
          <p>UPC: {product.upc || ''}</p>
          <p>Price: {product.price !== null && product.price !== undefined ? `$${product.price}` : 'Price TBD'}</p>
          {product.color && <p>Color: {product.color}</p>}
          {product.size && <p>Size: {product.size}</p>}
          {product.style && <p>Style: {product.style?.name || ''}</p>}
          <p style={{ marginTop: '12px', color: '#2563eb', fontSize: '14px' }}>Tap for details →</p>
        </div>
      )}

      <Modal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={product?.name || 'Product Details'}
      >
        {product && (
          <>
            <div className="modal-section">
              <div className="modal-field">
                <span className="modal-field-label">UPC</span>
                <div className="modal-field-value">{product.upc || ''}</div>
              </div>
              <div className="modal-field">
                <span className="modal-field-label">Price</span>
                <div className="modal-field-value">
                  {product.price !== null && product.price !== undefined 
                    ? `$${product.price}` 
                    : 'Not set'}
                </div>
              </div>
              {product.color && (
                <div className="modal-field">
                  <span className="modal-field-label">Color</span>
                  <div className="modal-field-value">{product.color}</div>
                </div>
              )}
              {product.size && (
                <div className="modal-field">
                  <span className="modal-field-label">Size</span>
                  <div className="modal-field-value">{product.size}</div>
                </div>
              )}
              {product.style && (
                <div className="modal-field">
                  <span className="modal-field-label">Style</span>
                  <div className="modal-field-value">{product.style?.name || ''} ({product.style?.styleCode || ''})</div>
                </div>
              )}
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Stock Locations</h3>
              {product.backStock && product.backStock.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>Backroom</h4>
                  <div className="modal-stock-list">
                    {product.backStock.map((stock) => (
                      <div key={stock.id} className="modal-stock-item">
                        <span className="modal-stock-location">{stock.location?.locationCode || 'Unknown'}</span>
                        <span className="modal-stock-qty">{stock.qty} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {product.salesStock && product.salesStock.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>Sales Floor</h4>
                  <div className="modal-stock-list">
                    {product.salesStock.map((stock) => (
                      <div key={stock.id} className="modal-stock-item">
                        <span className="modal-stock-location">{stock.location?.locationCode || 'Unknown'}</span>
                        <span className="modal-stock-qty">{stock.qty} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!product.backStock || product.backStock.length === 0) &&
                (!product.salesStock || product.salesStock.length === 0) && (
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
                  {product.needsConfiguration || product.status === 'UNCONFIGURED' ? '⚙️ Configure Product' : '✏️ Edit Product'}
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

      {/* Action Modal - Same as Products page */}
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

      <button
        className="manual-input-btn"
        onClick={() => setShowManualInput(!showManualInput)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"></rect>
          <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2"></line>
          <line x1="9" y1="15" x2="15" y2="15" strokeWidth="2"></line>
        </svg>
        Enter UPC Manually
      </button>

      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="manual-input-form">
          <input
            type="text"
            placeholder="Enter UPC code"
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            className="upc-input"
            autoFocus
          />
          <button type="submit" className="submit-btn">Scan</button>
        </form>
      )}

      <ProductEditModal
        product={product}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          // If product was just configured, show product modal
          if (product && product.status !== 'UNCONFIGURED') {
            setShowProductModal(true);
          }
        }}
        onSave={async (updatedProduct) => {
          setProduct(updatedProduct);
          showNotification('Product configured successfully!', 'success');
          // Close edit modal and show product details
          setShowEditModal(false);
          setShowProductModal(true);
        }}
      />
    </div>
  );
}

