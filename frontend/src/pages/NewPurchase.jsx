import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

// Helper to generate a unique client-side token to prevent duplicate submissions
function generateSubmissionToken() {
  return 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

export default function NewPurchase({ setActivePage, preselectedCustomerId }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || '');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form Fields
  const [category, setCategory] = useState('Sneakers');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('UPI / QR');

  // Backend Discount Preview State
  const [discountPreview, setDiscountPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Submission & Token
  const [submissionToken, setSubmissionToken] = useState(generateSubmissionToken());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [completedPurchase, setCompletedPurchase] = useState(null);

  // Load registered customers
  useEffect(() => {
    async function loadCustomers() {
      try {
        const list = await api.getCustomers();
        setCustomers(list);
        if (preselectedCustomerId) {
          const found = list.find((c) => c._id === preselectedCustomerId);
          if (found) {
            setSelectedCustomer(found);
            setSelectedCustomerId(found._id);
          }
        }
      } catch (err) {
        setError('Could not load customers: ' + err.message);
      }
    }
    loadCustomers();
  }, [preselectedCustomerId]);

  const handleCustomerChange = (e) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    const found = customers.find((c) => c._id === id);
    setSelectedCustomer(found || null);
    setDiscountPreview(null);
  };

  const grossAmount = Math.max(0, (Number(quantity) || 1) * (Number(price) || 0));

  // Fetch backend discount preview whenever customer or amount changes
  useEffect(() => {
    let active = true;

    async function fetchPreview() {
      if (!selectedCustomerId || grossAmount <= 0) {
        setDiscountPreview(null);
        return;
      }

      try {
        setPreviewLoading(true);
        const preview = await api.getDiscountPreview(selectedCustomerId, grossAmount);
        if (active) {
          setDiscountPreview(preview);
        }
      } catch (err) {
        console.error('Error fetching discount preview:', err);
      } finally {
        if (active) setPreviewLoading(false);
      }
    }

    fetchPreview();
    return () => {
      active = false;
    };
  }, [selectedCustomerId, grossAmount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select an existing customer.');
      return;
    }
    if (grossAmount <= 0) {
      setError('Please enter a valid price greater than ₹0.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        amount: grossAmount,
        purchaseDate,
        paymentMethod,
        submissionToken,
        items: [
          {
            category,
            description: description.trim() || `${category} - Standard Pair`,
            quantity: Number(quantity) || 1,
            price: Number(price) || 0,
          },
        ],
      };

      const result = await api.createPurchase(payload);
      setCompletedPurchase(result);
      // Refresh token for next operation
      setSubmissionToken(generateSubmissionToken());
    } catch (err) {
      setError(err.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupees = (amount) => {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Record Retail Purchase</h2>
          <p className="page-subtitle">
            5-Purchase Loyalty Reward: After 5 qualifying purchases, customer earns 10% discount on their next purchase
          </p>
        </div>
        <button className="btn-secondary" onClick={() => setActivePage('history')}>
          Purchase History
        </button>
      </div>

      <div className="form-card">
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          {/* 1. Customer Selection */}
          <div className="form-group">
            <label className="form-label">1. Existing Customer *</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={handleCustomerChange}
              disabled={submitting}
              required
            >
              <option value="">-- Choose a registered customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} — 📞 {c.phone} ({c.qualifyingPurchasesInCycle || 0}/5 purchases in cycle
                  {c.rewardAvailable || (c.qualifyingPurchasesInCycle || 0) >= 5 ? ' • 10% DISCOUNT READY! 🎉' : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Customer Loyalty Milestone Card */}
          {selectedCustomer && (
            <div
              style={{
                background: selectedCustomer.rewardAvailable || (selectedCustomer.qualifyingPurchasesInCycle || 0) >= 5 ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${selectedCustomer.rewardAvailable || (selectedCustomer.qualifyingPurchasesInCycle || 0) >= 5 ? '#a7f3d0' : '#e2e8f0'}`,
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{selectedCustomer.name}</strong>
                  <span style={{ marginLeft: '0.5rem', color: '#64748b', fontSize: '0.82rem' }}>
                    ({selectedCustomer.phone})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', color: '#475569' }}>Lifetime Purchases:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedCustomer.totalQualifyingPurchases || 0}</strong>
                </div>
              </div>

              {/* Cycle Progress Bar */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
                  <span>
                    Current Cycle Progress:{' '}
                    <strong>{selectedCustomer.qualifyingPurchasesInCycle || 0} of 5 qualifying purchases</strong>
                  </span>
                  <span>
                    {selectedCustomer.rewardAvailable || (selectedCustomer.qualifyingPurchasesInCycle || 0) >= 5 ? (
                      <strong style={{ color: '#047857' }}>10% DISCOUNT UNLOCKED!</strong>
                    ) : (
                      <span>{Math.max(0, 5 - (selectedCustomer.qualifyingPurchasesInCycle || 0))} more for 10% reward</span>
                    )}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, ((selectedCustomer.qualifyingPurchasesInCycle || 0) / 5) * 100)}%`,
                      backgroundColor: selectedCustomer.rewardAvailable || (selectedCustomer.qualifyingPurchasesInCycle || 0) >= 5 ? '#047857' : '#1b4332',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. Purchase Details */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
              2. Footwear & Purchase Information
            </h4>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                >
                  <option value="Sneakers">Sneakers</option>
                  <option value="Formal Shoes">Formal Shoes</option>
                  <option value="Loafers">Loafers</option>
                  <option value="Sandals & Slippers">Sandals & Slippers</option>
                  <option value="Boots">Boots</option>
                  <option value="Shoe Care & Accessories">Shoe Care & Accessories</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Model / Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Leather Oxford Tan Size 9"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price per Unit (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Purchase Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={submitting}
                >
                  <option value="UPI / QR">UPI / QR (PhonePe, GPay, Paytm)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit / Debit Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Live Backend Discount Calculation & Breakdown */}
          <div className="summary-box">
            <div className="summary-row">
              <span>Original Amount:</span>
              <span>{formatRupees(grossAmount)}</span>
            </div>

            {previewLoading && (
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontStyle: 'italic', margin: '0.25rem 0' }}>
                Calculating backend loyalty discount...
              </div>
            )}

            {discountPreview && discountPreview.isRewardEligible && (
              <div className="summary-row" style={{ color: '#047857', fontWeight: 700 }}>
                <span>🎉 10% Loyalty Reward Discount:</span>
                <span>- {formatRupees(discountPreview.discountAmount)}</span>
              </div>
            )}

            <div className="summary-row total">
              <span>Final Amount Payable:</span>
              <span>
                {formatRupees(discountPreview ? discountPreview.finalAmount : grossAmount)}
              </span>
            </div>

            {discountPreview && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: discountPreview.isRewardEligible ? '#d1fae5' : '#f1f5f9',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: discountPreview.isRewardEligible ? '#065f46' : '#475569',
                }}
              >
                {discountPreview.message}
              </div>
            )}
          </div>

          {/* Confirm & Submit */}
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
            disabled={submitting || !selectedCustomerId || grossAmount <= 0}
          >
            {submitting ? 'Recording Purchase in MongoDB...' : '✅ Confirm & Record Purchase'}
          </button>
        </form>
      </div>

      {/* Confirmation Receipt Modal */}
      {completedPurchase && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
              {completedPurchase.discountDetails?.loyaltyDiscountApplied ? '🎁' : '✅'}
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1b4332' }}>
              {completedPurchase.discountDetails?.loyaltyDiscountApplied
                ? '10% Loyalty Reward Applied!'
                : 'Purchase Recorded Successfully!'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
              Bill Number <strong>{completedPurchase.purchase?.billNumber}</strong> stored persistently in MongoDB.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                padding: '1.25rem',
                margin: '1.25rem 0',
                textAlign: 'left',
              }}
            >
              <div className="summary-row">
                <span>Customer:</span>
                <strong>{completedPurchase.purchase?.customer?.name}</strong>
              </div>
              <div className="summary-row">
                <span>Phone:</span>
                <span>{completedPurchase.purchase?.customer?.phone}</span>
              </div>
              <div className="summary-row">
                <span>Purchase Date:</span>
                <span>
                  {new Date(completedPurchase.purchase?.purchaseDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="summary-row">
                <span>Original Amount:</span>
                <span>{formatRupees(completedPurchase.purchase?.originalAmount)}</span>
              </div>

              {completedPurchase.purchase?.discountAmount > 0 && (
                <div className="summary-row" style={{ color: '#047857', fontWeight: 700 }}>
                  <span>10% Loyalty Discount:</span>
                  <span>- {formatRupees(completedPurchase.purchase?.discountAmount)}</span>
                </div>
              )}

              <div className="summary-row" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Final Amount Paid:</span>
                <strong style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                  {formatRupees(completedPurchase.purchase?.finalAmount)}
                </strong>
              </div>

              <div
                style={{
                  background: '#e8f5e9',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginTop: '1rem',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ fontWeight: 700, color: '#1b4332', marginBottom: '0.25rem' }}>
                  📊 Updated Customer Loyalty Status:
                </div>
                <div style={{ color: '#166534' }}>
                  • Lifetime Qualifying Purchases:{' '}
                  <strong>{completedPurchase.customerSummary?.totalQualifyingPurchases}</strong>
                </div>
                <div style={{ color: '#166534' }}>
                  • Current Cycle Progress:{' '}
                  <strong>{completedPurchase.customerSummary?.qualifyingPurchasesInCycle} of 5</strong>
                  {completedPurchase.customerSummary?.rewardAvailable
                    ? ' (10% reward unlocked for next purchase!)'
                    : ' purchases towards next reward'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setCompletedPurchase(null);
                  setActivePage('history');
                }}
              >
                View Purchase Log
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setCompletedPurchase(null);
                  setPrice('');
                  setDescription('');
                  setDiscountPreview(null);
                  // Reload customer list to reflect updated cycle counts
                  api.getCustomers().then(setCustomers);
                }}
              >
                + Next Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
