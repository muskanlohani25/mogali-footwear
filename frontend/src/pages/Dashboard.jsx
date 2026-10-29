import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Dashboard({ setActivePage, setSelectedCustomerId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const formatRupees = (amount) => {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
  };

  const getTierBadge = (tier) => {
    if (tier === 'Platinum') return <span className="badge badge-platinum">Platinum</span>;
    if (tier === 'Gold') return <span className="badge badge-gold">Gold</span>;
    return <span className="badge badge-silver">Silver</span>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
        <h3>Loading retail dashboard data from MongoDB...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>⚠️ {error}. Please ensure MongoDB and backend server are running.</span>
        <button
          className="btn-secondary"
          onClick={loadStats}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Retail Loyalty Dashboard</h2>
          <p className="page-subtitle">
            Derived in real-time from MongoDB: Total customers, completed purchases, retail sales, and discounts granted
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={() => setActivePage('customers')}>
            + New Customer
          </button>
          <button className="btn-primary" onClick={() => setActivePage('new-purchase')}>
            🛒 Record Purchase
          </button>
        </div>
      </div>

      {/* KPI Stats Grid (Total Customers, Completed Purchases, Total Sales, Discounts Granted) */}
      <div className="stats-grid">
        {/* 1. Total Customers */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Total Customers</span>
            <span>👥</span>
          </div>
          <div className="stat-value">{stats?.totalCustomers ?? 0}</div>
          <div className="stat-subtext">Registered in MongoDB collection</div>
        </div>

        {/* 2. Completed Purchases */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Completed Purchases</span>
            <span>🧾</span>
          </div>
          <div className="stat-value">{stats?.completedPurchases ?? 0}</div>
          <div className="stat-subtext">Recorded qualifying orders</div>
        </div>

        {/* 3. Total Sales */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Total Sales</span>
            <span>📈</span>
          </div>
          <div className="stat-value" style={{ color: '#1b4332' }}>
            {formatRupees(stats?.totalSales ?? 0)}
          </div>
          <div className="stat-subtext">Net retail revenue in INR</div>
        </div>

        {/* 4. Discounts Granted */}
        <div className="stat-card">
          <div className="stat-header">
            <span>Discounts Granted</span>
            <span>🎁</span>
          </div>
          <div className="stat-value" style={{ color: '#047857' }}>
            {formatRupees(stats?.discountsGranted ?? 0)}
          </div>
          <div className="stat-subtext">Total loyalty savings awarded</div>
        </div>
      </div>

      {/* Verification & Aggregation Summary Banner */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.86rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📊</span>
          <div>
            <strong style={{ color: '#0f172a' }}>MongoDB Aggregation Audit:</strong>
            <span style={{ color: '#64748b', marginLeft: '0.4rem' }}>
              Gross Volume: <strong>{formatRupees(stats?.totalOriginalAmount ?? 0)}</strong> •
              Discounts: <strong>{formatRupees(stats?.discountsGranted ?? 0)}</strong> •
              Net Sales: <strong>{formatRupees(stats?.totalSales ?? 0)}</strong>
            </span>
          </div>
        </div>
        <div style={{ color: '#166534', fontWeight: 600, background: '#e8f5e9', padding: '0.3rem 0.75rem', borderRadius: '6px' }}>
          ✓ Verified with MongoDB
        </div>
      </div>

      {/* Tier Overview Banner */}
      <div className="tier-overview-card">
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Loyalty Tier Distribution</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Silver (&lt;250 pts) • Gold (250–699 pts) • Platinum (700+ pts)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="tier-item">
            <div className="tier-circle silver">S</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>SILVER</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{stats?.tierDistribution?.silver || 0}</div>
            </div>
          </div>
          <div className="tier-item">
            <div className="tier-circle gold">G</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>GOLD</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{stats?.tierDistribution?.gold || 0}</div>
            </div>
          </div>
          <div className="tier-item">
            <div className="tier-circle platinum">P</div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>PLATINUM</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{stats?.tierDistribution?.platinum || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Top Loyal Customers & Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {/* Top Loyalty Customers */}
        <div className="table-card">
          <div className="table-header-box">
            <h3 className="table-title">Top Loyalty Champions</h3>
            <button
              onClick={() => setActivePage('customers')}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              View All
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Tier</th>
                  <th>Total Spent</th>
                  <th>Points Balance</th>
                </tr>
              </thead>
              <tbody>
                {stats?.topLoyalCustomers && stats.topLoyalCustomers.length > 0 ? (
                  stats.topLoyalCustomers.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.phone}</div>
                      </td>
                      <td>{getTierBadge(c.tier)}</td>
                      <td style={{ fontWeight: 600 }}>{formatRupees(c.totalSpent)}</td>
                      <td>
                        <strong style={{ color: '#1b4332' }}>{c.loyaltyPoints}</strong> pts
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      No customer records found in MongoDB.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="table-card">
          <div className="table-header-box">
            <h3 className="table-title">Recent In-Store Purchases</h3>
            <button
              onClick={() => setActivePage('history')}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
            >
              All Purchases
            </button>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Final Paid</th>
                  <th>Discount</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
                  stats.recentPurchases.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <span style={{ fontWeight: 700, color: '#1b4332' }}>{p.billNumber}</span>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {new Date(p.purchaseDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.customer?.name || 'Walk-in Guest'}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{p.customer?.phone || '—'}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatRupees(p.finalAmount)}</td>
                      <td>
                        {p.discountAmount > 0 ? (
                          <span style={{ color: '#047857', fontWeight: 700, background: '#d1fae5', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            -{formatRupees(p.discountAmount)}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>₹0</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      No recent purchases recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
