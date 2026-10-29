import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function PurchaseHistory({ setActivePage }) {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPurchases = async (searchTerm = '') => {
    try {
      setLoading(true);
      const data = await api.getPurchases(searchTerm);
      setPurchases(data);
    } catch (err) {
      console.error('Error fetching purchases from MongoDB:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(search);
  }, [search]);

  const formatRupees = (amount) => {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  };

  // Totals verification derived from currently loaded/filtered purchases
  const totals = purchases.reduce(
    (acc, p) => {
      acc.original += p.originalAmount || p.billAmount || 0;
      acc.discount += p.discountAmount || 0;
      acc.final += p.finalAmount || 0;
      return acc;
    },
    { original: 0, discount: 0, final: 0 }
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Purchase History & Ledger</h2>
          <p className="page-subtitle">
            Audit log of customer purchases with invoice reference, original amount, discounts, and final amounts
          </p>
        </div>
        <button className="btn-primary" onClick={() => setActivePage('new-purchase')}>
          🛒 + New Purchase
        </button>
      </div>

      {/* Totals Verification Bar (verifies totals against saved purchases) */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1.1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Orders Shown
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{purchases.length}</div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Original Amount
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#475569' }}>
            {formatRupees(totals.original)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Discounts Granted
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#047857' }}>
            {formatRupees(totals.discount)}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Total Final Sales
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1b4332' }}>
            {formatRupees(totals.final)}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-card">
        <div className="table-header-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by customer name, phone, or invoice ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing <strong>{purchases.length}</strong> record{purchases.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Invoice / Ref ID</th>
                <th>Purchase Date</th>
                <th>Original Amount (₹)</th>
                <th>Discount (₹)</th>
                <th>Final Amount (₹)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    Loading purchase records from MongoDB...
                  </td>
                </tr>
              ) : purchases.length > 0 ? (
                purchases.map((p) => {
                  const original = p.originalAmount || p.billAmount || 0;
                  const discount = p.discountAmount || 0;
                  const hasDiscount = p.loyaltyDiscountApplied || discount > 0;

                  return (
                    <tr key={p._id}>
                      {/* Customer Name */}
                      <td>
                        <strong style={{ color: '#0f172a' }}>{p.customer?.name || 'Walk-in Customer'}</strong>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          {p.customer?.phone ? `📞 ${p.customer.phone}` : 'No phone'}
                        </div>
                      </td>

                      {/* Invoice / Reference ID */}
                      <td>
                        <strong style={{ color: '#1b4332' }}>{p.billNumber}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ref: {p._id.slice(-6)}</div>
                      </td>

                      {/* Date */}
                      <td>
                        <div>
                          {new Date(p.purchaseDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(p.purchaseDate).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Original Amount */}
                      <td style={{ fontWeight: 600, color: '#475569' }}>
                        {formatRupees(original)}
                      </td>

                      {/* Discount */}
                      <td>
                        {hasDiscount ? (
                          <span
                            style={{
                              color: '#047857',
                              fontWeight: 700,
                              background: '#d1fae5',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                            }}
                          >
                            - {formatRupees(discount)} {p.loyaltyDiscountApplied ? '(10% Off)' : ''}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>₹0</span>
                        )}
                      </td>

                      {/* Final Amount */}
                      <td>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
                          {formatRupees(p.finalAmount)}
                        </strong>
                      </td>

                      {/* Action */}
                      <td>
                        <button
                          className="btn-secondary"
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
                          onClick={() => setSelectedReceipt(p)}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Empty Data Handling */
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#94a3b8' }}>
                    {search ? (
                      <div>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🔍 No Purchases Found</div>
                        <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
                          No purchases matched your search query "<strong>{search}</strong>".
                        </p>
                        <button
                          className="btn-secondary"
                          style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                          onClick={() => setSearch('')}
                        >
                          Clear Search Filter
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🧾 No Purchases Recorded</div>
                        <p style={{ fontSize: '0.86rem', color: '#64748b' }}>
                          No purchase history exists in MongoDB yet. Click below to record your first sale.
                        </p>
                        <button
                          className="btn-primary"
                          style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
                          onClick={() => setActivePage('new-purchase')}
                        >
                          + Record New Purchase
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1b4332' }}>
                  Mogali Footwear Receipt
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Invoice #{selectedReceipt.billNumber}</p>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedReceipt(null)}>
                &times;
              </button>
            </div>

            <div style={{ fontSize: '0.86rem', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Customer Name:</span>
                <strong>{selectedReceipt.customer?.name || 'Walk-in'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Phone:</span>
                <span>{selectedReceipt.customer?.phone || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Invoice / Ref ID:</span>
                <code>{selectedReceipt.billNumber} ({selectedReceipt._id.slice(-6)})</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Purchase Date:</span>
                <span>{new Date(selectedReceipt.purchaseDate).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Payment Mode:</span>
                <span>{selectedReceipt.paymentMethod}</span>
              </div>

              <hr style={{ margin: '0.85rem 0', borderColor: '#e2e8f0' }} />

              <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: '#0f172a' }}>Footwear Items:</div>
              {selectedReceipt.items?.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span>
                    {it.quantity}x {it.category} ({it.description || 'Footwear'})
                  </span>
                  <span>{formatRupees((it.price || selectedReceipt.originalAmount) * (it.quantity || 1))}</span>
                </div>
              ))}

              <hr style={{ margin: '0.85rem 0', borderColor: '#e2e8f0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Original Amount:</span>
                <span>{formatRupees(selectedReceipt.originalAmount || selectedReceipt.billAmount)}</span>
              </div>

              {selectedReceipt.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857', fontWeight: 700 }}>
                  <span>
                    {selectedReceipt.loyaltyDiscountApplied ? '10% Loyalty Discount:' : 'Discount Amount:'}
                  </span>
                  <span>- {formatRupees(selectedReceipt.discountAmount)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: '#1b4332',
                  marginTop: '0.4rem',
                }}
              >
                <span>Final Amount Paid:</span>
                <span>{formatRupees(selectedReceipt.finalAmount)}</span>
              </div>

              {selectedReceipt.loyaltyDiscountApplied && (
                <div
                  style={{
                    background: '#d1fae5',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '6px',
                    marginTop: '0.85rem',
                    color: '#065f46',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  🎉 10% Loyalty Reward applied on this purchase after 5 qualifying purchases!
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button className="btn-secondary" onClick={() => setSelectedReceipt(null)}>
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
