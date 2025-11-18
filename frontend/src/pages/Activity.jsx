import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import './Activity.css';

export default function Activity() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [showMovementModal, setShowMovementModal] = useState(false);

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMovements({ take: '50' });
      // Ensure we always set an array
      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err?.message || 'Failed to load activity';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeLabel = (type) => {
    const labels = {
      PLACE_IN_BACK: 'Place',
      PULL_FROM_BACK: 'Pull',
      AUDIT_BACKROOM: 'Audit',
      PLACE_ON_FLOOR: 'Place',
      MOVE_ON_FLOOR: 'Move',
      REMOVE_FROM_FLOOR: 'Remove',
    };
    return labels[type] || type;
  };

  const getMovementIcon = (type) => {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14M5 12h14" strokeWidth="2"></path>
      </svg>
    );
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) return <div className="loading">Loading activity...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="activity-page">
      <div className="activity-header">
        <h1 className="page-title">Activity</h1>
        <p className="page-subtitle">Recent inventory movements and changes</p>
      </div>

      <div className="activity-list">
        {Array.isArray(movements) && movements.length > 0 ? (
          movements.map((movement) => {
            if (!movement || !movement.id) return null;
            return (
              <div
                key={movement.id}
                className="activity-card"
                onClick={() => {
                  setSelectedMovement(movement);
                  setShowMovementModal(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="activity-icon">
                  {getMovementIcon(movement.type)}
                </div>
                <div className="activity-content">
                  <div className="activity-badge">
                    {getMovementTypeLabel(movement.type || 'UNKNOWN')} {movement.qty || 0} units
                  </div>
                  <p className="activity-product-id">Product ID: {movement.productId || 'N/A'}</p>
                  <p className="activity-notes">{movement.notes || 'No notes'}</p>
                  <div className="activity-time">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                      <path d="M12 6v6l4 2" strokeWidth="2"></path>
                    </svg>
                    {movement.timestamp ? formatTimeAgo(movement.timestamp) : 'Unknown time'}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">No activity yet</div>
        )}
      </div>

      <Modal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title="Movement Details"
      >
        {selectedMovement && (
          <>
            <div className="modal-section">
              <div className="modal-field">
                <span className="modal-field-label">Movement Type</span>
                <div className="modal-field-value">{getMovementTypeLabel(selectedMovement.type || 'UNKNOWN')}</div>
              </div>
              <div className="modal-field">
                <span className="modal-field-label">Quantity</span>
                <div className="modal-field-value">{selectedMovement.qty || 0} units</div>
              </div>
              <div className="modal-field">
                <span className="modal-field-label">Product ID</span>
                <div className="modal-field-value" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                  {selectedMovement.productId || 'N/A'}
                </div>
              </div>
              {selectedMovement.product && (
                <div className="modal-field">
                  <span className="modal-field-label">Product Name</span>
                  <div className="modal-field-value">{selectedMovement.product.name || 'Unnamed Product'}</div>
                </div>
              )}
              <div className="modal-field">
                <span className="modal-field-label">Timestamp</span>
                <div className="modal-field-value">
                  {selectedMovement.timestamp 
                    ? new Date(selectedMovement.timestamp).toLocaleString() 
                    : 'Unknown'}
                </div>
              </div>
              {selectedMovement.notes && (
                <div className="modal-field">
                  <span className="modal-field-label">Notes</span>
                  <div className="modal-field-value">{selectedMovement.notes}</div>
                </div>
              )}
            </div>

            <div className="modal-section">
              <h3 className="modal-section-title">Location Details</h3>
              {selectedMovement.fromBackroomLocation && (
                <div className="modal-field">
                  <span className="modal-field-label">From (Backroom)</span>
                  <div className="modal-field-value">
                    {selectedMovement.fromBackroomLocation.locationCode || 'Unknown'}
                  </div>
                </div>
              )}
              {selectedMovement.toBackroomLocation && (
                <div className="modal-field">
                  <span className="modal-field-label">To (Backroom)</span>
                  <div className="modal-field-value">
                    {selectedMovement.toBackroomLocation.locationCode || 'Unknown'}
                  </div>
                </div>
              )}
              {selectedMovement.fromSalesFloorLocation && (
                <div className="modal-field">
                  <span className="modal-field-label">From (Sales Floor)</span>
                  <div className="modal-field-value">
                    {selectedMovement.fromSalesFloorLocation.locationCode || 'Unknown'}
                  </div>
                </div>
              )}
              {selectedMovement.toSalesFloorLocation && (
                <div className="modal-field">
                  <span className="modal-field-label">To (Sales Floor)</span>
                  <div className="modal-field-value">
                    {selectedMovement.toSalesFloorLocation.locationCode || 'Unknown'}
                  </div>
                </div>
              )}
              {!selectedMovement.fromBackroomLocation &&
                !selectedMovement.toBackroomLocation &&
                !selectedMovement.fromSalesFloorLocation &&
                !selectedMovement.toSalesFloorLocation && (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>No location information</p>
                )}
            </div>
          </>
        )}
      </Modal>

    </div>
  );
}

