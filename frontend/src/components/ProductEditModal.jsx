import { useState, useEffect } from 'react';
import { api } from '../services/api';
import Modal from './Modal';
import './ProductEditModal.css';

export default function ProductEditModal({ product, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    departmentId: '',
    styleId: '',
    variantId: '',
    status: 'UNCONFIGURED',
    color: '',
    size: '',
  });
  const [departments, setDepartments] = useState([]);
  const [styles, setStyles] = useState([]);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || '',
        price: product.price || '',
        departmentId: product.departmentId || '',
        styleId: product.styleId || '',
        variantId: product.variantId || '',
        status: product.status || 'UNCONFIGURED',
        color: product.color || '',
        size: product.size || '',
      });
      loadData();
    }
  }, [product, isOpen]);

  // Auto-focus name field for new products
  useEffect(() => {
    if (isOpen && product && product.status === 'UNCONFIGURED') {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const nameInput = document.querySelector('input[name="name"]');
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }, 100);
    }
  }, [isOpen, product]);

  const loadData = async () => {
    try {
      const [depts, stls] = await Promise.all([
        api.getDepartments(),
        api.getStyles(),
      ]);
      setDepartments(depts);
      setStyles(stls);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    if (formData.styleId) {
      // Load variants for selected style
      api.getStyles().then(styles => {
        const style = styles.find(s => s.id === formData.styleId);
        if (style && style.variants) {
          setVariants(style.variants);
        }
      }).catch(() => setVariants([]));
    } else {
      setVariants([]);
    }
  }, [formData.styleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        name: formData.name,
        price: formData.price ? parseFloat(formData.price) : null,
        departmentId: formData.departmentId || null,
        styleId: formData.styleId || null,
        variantId: formData.variantId || null,
        status: formData.status,
        color: formData.color || null,
        size: formData.size || null,
      };

      const updated = await api.updateProduct(product.id, updateData);
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product?.status === 'UNCONFIGURED' ? 'Configure New Product' : 'Edit Product'}>
      <form onSubmit={handleSubmit} className="product-edit-form">
        {error && <div className="error-message">{error}</div>}
        
        {product?.status === 'UNCONFIGURED' && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '14px',
            fontWeight: 500
          }}>
            ⚠️ This is a new product. Please fill in the details below to configure it.
          </div>
        )}

        <div className="form-group">
          <label>Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter product name"
          />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="UNCONFIGURED">Unconfigured</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="DISCONTINUED">Discontinued</option>
          </select>
        </div>

        <div className="form-group">
          <label>Department</label>
          <select name="departmentId" value={formData.departmentId} onChange={handleChange}>
            <option value="">None</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Style</label>
          <select name="styleId" value={formData.styleId} onChange={handleChange}>
            <option value="">None</option>
            {styles.map(style => (
              <option key={style.id} value={style.id}>{style.name} ({style.styleCode})</option>
            ))}
          </select>
        </div>

        {formData.styleId && variants.length > 0 && (
          <div className="form-group">
            <label>Variant</label>
            <select name="variantId" value={formData.variantId} onChange={handleChange}>
              <option value="">None</option>
              {variants.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.variantCode} {variant.size && `- ${variant.size}`} {variant.color && `- ${variant.color}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Color</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Color"
            />
          </div>

          <div className="form-group">
            <label>Size</label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="Size"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

