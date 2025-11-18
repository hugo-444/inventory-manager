import { useState, useEffect } from 'react';
import { api, getApiBaseUrlForFetch } from '../services/api';
import Modal from '../components/Modal';
import Notification from '../components/Notification';
import './Locations.css';

export default function Locations() {
  const [backroomLocations, setBackroomLocations] = useState([]);
  const [salesFloorLocations, setSalesFloorLocations] = useState([]);
  const [expandedItems, setExpandedItems] = useState(new Set(['warehouse']));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocationType, setNewLocationType] = useState('backroom');
  const [newLocationData, setNewLocationData] = useState({
    locationCode: '',
    aisle: '',
    column: '',
    bay: '',
    departmentCode: '',
    parentCode: '',
    sectionCode: '',
  });
  const [notification, setNotification] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [parentFixtures, setParentFixtures] = useState([]);
  const [locationProducts, setLocationProducts] = useState([]);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'style', 'qty', 'upc'

  useEffect(() => {
    loadLocations();
    loadDepartments();
  }, []);

  useEffect(() => {
    if (newLocationType === 'salesfloor' && newLocationData.departmentCode) {
      loadParentFixtures();
    }
  }, [newLocationData.departmentCode, newLocationType]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const [backroom, salesFloor] = await Promise.all([
        api.getBackroomLocations(),
        api.getSalesFloorLocations(),
      ]);
      // Ensure we always set arrays
      setBackroomLocations(Array.isArray(backroom) ? backroom : []);
      setSalesFloorLocations(Array.isArray(salesFloor) ? salesFloor : []);
    } catch (err) {
      console.error('Failed to load locations:', err);
      const errorMessage = err?.message || 'Failed to load locations';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const depts = await api.getDepartments();
      setDepartments(Array.isArray(depts) ? depts : []);
    } catch (err) {
      console.error('Failed to load departments:', err);
      setDepartments([]);
    }
  };

  const loadParentFixtures = async () => {
    try {
      const dept = Array.isArray(departments) ? departments.find(d => d && d.code === newLocationData.departmentCode) : null;
      if (dept && dept.id) {
        const fixtures = await api.getParentFixtures(dept.id);
        setParentFixtures(Array.isArray(fixtures) ? fixtures : []);
      } else {
        setParentFixtures([]);
      }
    } catch (err) {
      console.error('Failed to load parent fixtures:', err);
      setParentFixtures([]);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const formatBackroomLocation = (loc) => {
    if (loc.overflowTote) {
      return loc.locationCode;
    }
    return `${loc.aisle?.aisleNumber || ''}${loc.column?.columnLetter || ''}${loc.bay?.bayNumber || ''}`;
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      if (newLocationType === 'backroom') {
        if (!newLocationData.locationCode.trim()) {
          showNotification('Location code is required', 'error');
          setCreateLoading(false);
          return;
        }
        await api.createBackroomLocation({ locationCode: newLocationData.locationCode.trim() });
        showNotification(`Backroom location ${newLocationData.locationCode} created successfully`, 'success');
      } else {
        if (!newLocationData.departmentCode.trim() || !newLocationData.parentCode.trim()) {
          showNotification('Department code and parent fixture code are required', 'error');
          setCreateLoading(false);
          return;
        }
        await api.createSalesFloorLocation({
          departmentCode: newLocationData.departmentCode.trim(),
          parentCode: newLocationData.parentCode.trim(),
          sectionCode: newLocationData.sectionCode.trim() || undefined,
        });
        const locationCode = newLocationData.sectionCode
          ? `${newLocationData.departmentCode}${newLocationData.parentCode}(${newLocationData.sectionCode})`
          : `${newLocationData.departmentCode}${newLocationData.parentCode}`;
        showNotification(`Sales floor location ${locationCode} created successfully`, 'success');
      }
      setShowAddModal(false);
      setNewLocationData({
        locationCode: '',
        aisle: '',
        column: '',
        bay: '',
        departmentCode: '',
        parentCode: '',
        sectionCode: '',
      });
      await loadLocations();
    } catch (err) {
      showNotification(err.message || 'Failed to create location', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLocationClick = async (location) => {
    setSelectedLocation(location);
    setShowLocationModal(true);
    
    // Load products at this location with full details including style codes
    try {
      let products = [];
      if (location.locationCode) {
          // Try unified endpoint first
        try {
          const response = await fetch(`${getApiBaseUrlForFetch()}/api/locations/${location.locationCode}/products`);
          if (response.ok) {
            const data = await response.json();
            products = data.products || [];
          }
        } catch (err) {
          // Fallback to type-specific endpoints
          if (location.aisle || location.overflowTote) {
            const response = await fetch(`${getApiBaseUrlForFetch()}/api/locations/backroom/${location.locationCode}/products`);
            if (response.ok) {
              products = await response.json();
            }
          } else if (location.department) {
            const response = await fetch(`${getApiBaseUrlForFetch()}/api/locations/sales-floor/${location.locationCode}/products`);
            if (response.ok) {
              products = await response.json();
            }
          }
        }
        
        // Fetch full product details to get style codes
        if (Array.isArray(products) && products.length > 0) {
          const productsWithDetails = await Promise.all(
            products.map(async (item) => {
              if (!item || !item.productId) return null;
              try {
                const product = await api.getProductById(item.productId);
                return {
                  ...item,
                  styleCode: product?.style?.styleCode || null,
                  styleName: product?.style?.name || null,
                  departmentName: product?.department?.name || null,
                };
              } catch {
                return item;
              }
            })
          );
          setLocationProducts(productsWithDetails.filter(Boolean));
        } else {
          setLocationProducts([]);
        }
      }
    } catch (err) {
      console.error('Failed to load location products:', err);
      setLocationProducts([]);
    }
  };

  if (loading) return <div className="loading">Loading locations...</div>;
  if (error) {
    return (
      <div className="locations-page">
        <h1 className="page-title">Locations</h1>
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
    <div className="locations-page">
      <div className="locations-header">
        <h1 className="page-title">Locations</h1>
        <button className="add-location-btn" onClick={() => setShowAddModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2"></line>
            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2"></line>
          </svg>
          Add Location
        </button>
      </div>

      <div className="location-hierarchy">
        <h2 className="hierarchy-title">Location Hierarchy</h2>

        <div className="hierarchy-item">
          <div
            className="hierarchy-row"
            onClick={() => toggleExpand('warehouse')}
          >
            <svg
              className={`chevron ${expandedItems.has('warehouse') ? 'expanded' : ''}`}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M6 9l6 6 6-6" strokeWidth="2"></path>
            </svg>
            <svg className="folder-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeWidth="2"></path>
            </svg>
            <span className="hierarchy-label">Main Warehouse</span>
            <span className="hierarchy-code">WH-01</span>
          </div>

          {expandedItems.has('warehouse') && (
            <div className="hierarchy-children">
              {/* Backroom Aisles */}
              {Array.isArray(backroomLocations) && Array.from(new Set(backroomLocations.map(l => l?.aisle?.aisleNumber).filter(Boolean))).map((aisleNum) => (
                <div key={`aisle-${aisleNum}`} className="hierarchy-item nested">
                  <div
                    className="hierarchy-row"
                    onClick={() => toggleExpand(`aisle-${aisleNum}`)}
                  >
                    <svg
                      className={`chevron ${expandedItems.has(`aisle-${aisleNum}`) ? 'expanded' : ''}`}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path d="M9 18l6-6-6-6" strokeWidth="2"></path>
                    </svg>
                    <svg className="shelf-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2"></line>
                      <line x1="3" y1="15" x2="21" y2="15" strokeWidth="2"></line>
                    </svg>
                    <span className="hierarchy-label">Aisle {aisleNum}</span>
                    <span className="hierarchy-code">A{aisleNum}</span>
                  </div>
                  {expandedItems.has(`aisle-${aisleNum}`) && (
                    <div className="hierarchy-children">
                      {Array.isArray(backroomLocations) && backroomLocations
                        .filter(l => l && l.aisle?.aisleNumber === aisleNum)
                        .map((loc) => (
                          loc && loc.id ? (
                            <div key={loc.id} className="hierarchy-item nested">
                              <div className="hierarchy-row" onClick={() => handleLocationClick(loc)}>
                                <svg className="shelf-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"></rect>
                                </svg>
                                <span className="hierarchy-label">{loc.locationCode || 'Unknown'}</span>
                                <span className="hierarchy-code">{loc.bay?.type || 'location'}</span>
                              </div>
                            </div>
                          ) : null
                        ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Sales Floor Locations */}
              {Array.isArray(salesFloorLocations) && salesFloorLocations.map((loc) => (
                loc && loc.id ? (
                  <div key={loc.id} className="hierarchy-item nested">
                    <div className="hierarchy-row" onClick={() => handleLocationClick(loc)}>
                      <svg className="shelf-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"></rect>
                      </svg>
                      <span className="hierarchy-label">{loc.locationCode || 'Unknown'}</span>
                      <span className="hierarchy-code">{loc.department?.code || ''}</span>
                    </div>
                  </div>
                ) : null
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Location Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Location"
      >
        <form onSubmit={handleAddLocation}>
          <div className="modal-form-group">
            <label className="modal-form-label">Location Type</label>
            <select
              className="modal-form-select"
              value={newLocationType}
              onChange={(e) => setNewLocationType(e.target.value)}
            >
              <option value="backroom">Backroom</option>
              <option value="salesfloor">Sales Floor</option>
            </select>
          </div>

          {newLocationType === 'backroom' ? (
            <div className="modal-form-group">
              <label className="modal-form-label">Location Code</label>
              <input
                type="text"
                className="modal-form-input"
                placeholder="e.g., 04C12 or O4TT88"
                value={newLocationData.locationCode}
                onChange={(e) => setNewLocationData({ ...newLocationData, locationCode: e.target.value })}
                required
                pattern="^(0[1-7][A-Z][0-9]{1,2}|O[0-9]+TT[0-9]+)$"
                title="Format: 04C12 (aisle 1-7, column A-Z, bay 1-20) or O4TT88 (overflow)"
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Format: AisleColumnBay (e.g., 04C12) or Overflow (e.g., O4TT88)
              </p>
            </div>
          ) : (
            <>
              <div className="modal-form-group">
                <label className="modal-form-label">Department</label>
                <select
                  className="modal-form-select"
                  value={newLocationData.departmentCode}
                  onChange={(e) => {
                    setNewLocationData({ ...newLocationData, departmentCode: e.target.value, parentCode: '' });
                    setParentFixtures([]);
                  }}
                  required
                >
                  <option value="">Select department...</option>
                  {Array.isArray(departments) && departments.map((dept) => (
                    dept && dept.id ? (
                      <option key={dept.id} value={dept.code}>
                        {dept.name || 'Unnamed'} ({dept.code || 'N/A'})
                      </option>
                    ) : null
                  ))}
                </select>
              </div>
              {newLocationData.departmentCode && (
                <div className="modal-form-group">
                  <label className="modal-form-label">Parent Fixture</label>
                  {Array.isArray(parentFixtures) && parentFixtures.length > 0 ? (
                    <select
                      className="modal-form-select"
                      value={newLocationData.parentCode}
                      onChange={(e) => setNewLocationData({ ...newLocationData, parentCode: e.target.value })}
                      required
                    >
                      <option value="">Select fixture...</option>
                      {parentFixtures.map((fixture) => (
                        fixture && fixture.id ? (
                          <option key={fixture.id} value={fixture.parentCode}>
                            {fixture.parentCode || 'N/A'} ({fixture.type || 'N/A'})
                          </option>
                        ) : null
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="modal-form-input"
                      placeholder="e.g., MT02"
                      value={newLocationData.parentCode}
                      onChange={(e) => setNewLocationData({ ...newLocationData, parentCode: e.target.value })}
                      required
                    />
                  )}
                </div>
              )}
              <div className="modal-form-group">
                <label className="modal-form-label">Section Code (optional)</label>
                <input
                  type="text"
                  className="modal-form-input"
                  placeholder="e.g., 99"
                  value={newLocationData.sectionCode}
                  onChange={(e) => setNewLocationData({ ...newLocationData, sectionCode: e.target.value })}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Leave empty if no section
                </p>
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={() => {
                setShowAddModal(false);
                setNewLocationData({
                  locationCode: '',
                  aisle: '',
                  column: '',
                  bay: '',
                  departmentCode: '',
                  parentCode: '',
                  sectionCode: '',
                });
              }}
              disabled={createLoading}
            >
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-primary" disabled={createLoading}>
              {createLoading ? 'Creating...' : 'Create Location'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Location Details Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title={selectedLocation?.locationCode || 'Location Details'}
      >
        {selectedLocation && (
          <>
            <div className="modal-section">
              <div className="modal-field">
                <span className="modal-field-label">Location Code</span>
                <div className="modal-field-value">{selectedLocation.locationCode || ''}</div>
              </div>
              {selectedLocation.department && (
                <div className="modal-field">
                  <span className="modal-field-label">Department</span>
                  <div className="modal-field-value">{selectedLocation.department?.name || ''} ({selectedLocation.department?.code || ''})</div>
                </div>
              )}
              {selectedLocation.parentFixture && (
                <div className="modal-field">
                  <span className="modal-field-label">Parent Fixture</span>
                  <div className="modal-field-value">{selectedLocation.parentFixture?.parentCode || ''} ({selectedLocation.parentFixture?.type || ''})</div>
                </div>
              )}
              {selectedLocation.section && (
                <div className="modal-field">
                  <span className="modal-field-label">Section</span>
                  <div className="modal-field-value">{selectedLocation.section?.sectionCode || ''} ({selectedLocation.section?.sectionType || ''})</div>
                </div>
              )}
              {selectedLocation.aisle && (
                <div className="modal-field">
                  <span className="modal-field-label">Aisle</span>
                  <div className="modal-field-value">{selectedLocation.aisle?.aisleNumber || ''}</div>
                </div>
              )}
              {selectedLocation.column && (
                <div className="modal-field">
                  <span className="modal-field-label">Column</span>
                  <div className="modal-field-value">{selectedLocation.column?.columnLetter || ''}</div>
                </div>
              )}
              {selectedLocation.bay && (
                <div className="modal-field">
                  <span className="modal-field-label">Bay</span>
                  <div className="modal-field-value">{selectedLocation.bay?.bayNumber || ''} ({selectedLocation.bay?.type || ''})</div>
                </div>
              )}
              {selectedLocation.overflowTote && (
                <div className="modal-field">
                  <span className="modal-field-label">Overflow Tote</span>
                  <div className="modal-field-value">{selectedLocation.overflowTote?.code || ''}</div>
                </div>
              )}
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Products at this Location</h3>
              
              {/* Sort controls */}
              {locationProducts.length > 0 && (
                <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600 }}>Sort by:</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{ 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="style">Style Code</option>
                    <option value="upc">UPC</option>
                    <option value="qty">Quantity (High to Low)</option>
                    <option value="qtyAsc">Quantity (Low to High)</option>
                  </select>
                </div>
              )}

              {Array.isArray(locationProducts) && locationProducts.length > 0 ? (
                <div className="modal-stock-list">
                  {[...locationProducts]
                    .filter(item => item && item.productId)
                    .sort((a, b) => {
                      if (sortBy === 'style') {
                        const aStyle = a?.styleCode || '';
                        const bStyle = b?.styleCode || '';
                        if (aStyle === bStyle) return (a?.name || '').localeCompare(b?.name || '');
                        return aStyle.localeCompare(bStyle);
                      } else if (sortBy === 'qty') {
                        return (b?.qty || 0) - (a?.qty || 0);
                      } else if (sortBy === 'qtyAsc') {
                        return (a?.qty || 0) - (b?.qty || 0);
                      } else if (sortBy === 'upc') {
                        return (a?.upc || '').localeCompare(b?.upc || '');
                      } else {
                        return (a?.name || '').localeCompare(b?.name || '');
                      }
                    })
                    .map((item) => (
                      item && item.productId ? (
                        <div 
                          key={item.productId} 
                          className="modal-stock-item" 
                          style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => {
                            if (item.upc) {
                              window.location.href = `/#/products?search=${item.upc}`;
                            }
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.name || 'Unnamed Product'}</div>
                            <div style={{ fontSize: '12px', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span>UPC: {item.upc || 'N/A'}</span>
                              {item.styleCode && <span>Style: <strong>{item.styleCode}</strong></span>}
                              {item.styleName && <span>({item.styleName})</span>}
                              {item.departmentName && <span>Dept: {item.departmentName}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                            <div style={{ fontWeight: 600, fontSize: '20px', color: '#3b82f6' }}>{item.qty || 0}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>units</div>
                          </div>
                        </div>
                      ) : null
                    ))}
                </div>
              ) : (
                <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
                  No products at this location
                </p>
              )}
            </div>
          </>
        )}
      </Modal>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

