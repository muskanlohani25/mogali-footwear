import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function Customers({ setActivePage, onSelectCustomerForPurchase }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async (searchTerm = '') => {
    try {
      setLoading(true);
      const data = await api.getCustomers(searchTerm);
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!name.trim()) {
      setFormError('Please enter the customer name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter a 10-digit mobile number.');
      return;
    }

    try {
      setSubmitting(true);
      const newCustomer = await api.createCustomer({ name, phone, email });
      setFormSuccess(`Customer "${newCustomer.name}" registered successfully with phone ${newCustomer.phone}!`);
      setName('');
      setPhone('');
      setEmail('');
      fetchCustomers(search);
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to register customer');
    } finally {
      setSubmitting(false);
    }
  };

  const openCustomerDetails = async (id) => {
    try {
      setModalLoading(true);
      const details = await api.getCustomerById(id);
      setSelectedCustomerDetails(details);
    } catch (err) {
      alert('Error fetching customer details: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const getTierBadge = (tier) => {
    if (tier === 'Platinum') return <span className="badge badge-platinum">Platinum</span>;
    if (tier === 'Gold') return <span className="badge badge-gold">Gold</span>;
    return <span className="badge badge-silver">Silver</span>;
  };

  const formatRupees = (amount) => {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customer Loyalty Directory</h2>
          <p className="page-subtitle">
            Manage customer profiles, normalized phone records, qualifying purchases, and loyalty points
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            setFormError('');
            setFormSuccess('');
            setShowAddModal(true);
          }}
        >
          + Add New Customer
        </button>
      </div>

      {/* Search Bar & Table Header */}
      <div className="table-card">
        <div className="table-header-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by customer name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing <strong>{customers.length}</strong> registered customer{customers.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone (Normalized)</th>
                <th>Email</th>
                <th>Qualifying Purchases</th>
                <th>Total Spent</th>
                <th>Tier</th>
                <th>Points Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading customers from MongoDB...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{c.name}</strong>
                    </td>
                    <td>
                      <code style={{ background: '#f1f5f9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                        {c.phone}
                      </code>
                    </td>
                    <td style={{ color: '#64748b' }}>{c.email || '—'}</td>
                    <td>
                      <div>
                        <strong>{c.qualifyingPurchasesInCycle || 0} / 5</strong> in cycle
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Lifetime: {c.totalQualifyingPurchases || 0}
                      </div>
                      {(c.rewardAvailable || (c.qualifyingPurchasesInCycle || 0) >= 5) && (
                        <span style={{ display: 'inline-block', marginTop: '0.2rem', fontSize: '0.7rem', fontWeight: 700, color: '#047857', background: '#d1fae5', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          🎁 10% Off Ready!
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatRupees(c.totalSpent)}</td>
                    <td>{getTierBadge(c.tier)}</td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#1b4332', fontSize: '0.95rem' }}>
                        {c.loyaltyPoints}
                      </span>{' '}
                      pts
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => openCustomerDetails(c._id)}
                        >
                          View Details
                        </button>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                          onClick={() => {
                            if (onSelectCustomerForPurchase) {
                              onSelectCustomerForPurchase(c._id);
                            }
                            setActivePage('new-purchase');
                          }}
                        >
                          + Purchase
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No customer records matched your query "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Customer */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Add New Customer</h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Creates a persistent customer record in MongoDB</p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>

            {formError && (
              <div className="alert alert-error">
                <span>⚠️ {formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="alert alert-success">
                <span>✅ {formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Naidu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  required
                />
                <p className="form-hint">At least 2 characters long.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={submitting}
                  required
                />
                <p className="form-hint">
                  Must be a valid 10-digit number. Automatically normalized (+91 and spaces are stripped).
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. ramesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '0.85rem',
                  borderRadius: '6px',
                  marginBottom: '1.5rem',
                  fontSize: '0.82rem',
                  color: '#475569',
                }}
              >
                🎉 <strong>Welcome Perk:</strong> New customers automatically receive <strong>50 bonus loyalty points</strong> on registration!
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Customer Details & Purchases */}
      {selectedCustomerDetails && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedCustomerDetails.customer.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  📞 {selectedCustomerDetails.customer.phone} • ✉️ {selectedCustomerDetails.customer.email || 'No email provided'} • Enrolled on{' '}
                  {new Date(selectedCustomerDetails.customer.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedCustomerDetails(null)}>
                &times;
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Tier</div>
                <div style={{ marginTop: '0.35rem' }}>{getTierBadge(selectedCustomerDetails.customer.tier)}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Qualifying Purchases</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {selectedCustomerDetails.customer.totalQualifyingPurchases || 0}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Spent</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                  {formatRupees(selectedCustomerDetails.customer.totalSpent)}
                </div>
              </div>

              <div style={{ background: '#e8f5e9', padding: '0.85rem', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#1b4332', textTransform: 'uppercase', fontWeight: 700 }}>Points Balance</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332', marginTop: '0.2rem' }}>
                  {selectedCustomerDetails.customer.loyaltyPoints} pts
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#0f172a' }}>
              Transaction Log ({selectedCustomerDetails.purchases?.length || 0})
            </h4>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Bill No</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Net Paid</th>
                    <th>Points Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomerDetails.purchases && selectedCustomerDetails.purchases.length > 0 ? (
                    selectedCustomerDetails.purchases.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 700, color: '#1b4332' }}>{p.billNumber}</td>
                        <td>{new Date(p.purchaseDate).toLocaleDateString('en-IN')}</td>
                        <td>{p.items?.map((i) => i.category).join(', ') || 'Footwear'}</td>
                        <td style={{ fontWeight: 700 }}>{formatRupees(p.finalAmount)}</td>
                        <td style={{ color: '#15803d', fontWeight: 700 }}>+{p.pointsEarned} pts</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                        No purchases recorded yet for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  if (onSelectCustomerForPurchase) {
                    onSelectCustomerForPurchase(selectedCustomerDetails.customer._id);
                  }
                  setSelectedCustomerDetails(null);
                  setActivePage('new-purchase');
                }}
              >
                + Record Purchase for {selectedCustomerDetails.customer.name}
              </button>
              <button className="btn-secondary" onClick={() => setSelectedCustomerDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
