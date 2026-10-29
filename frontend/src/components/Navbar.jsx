import React from 'react';

export default function Navbar({ activePage, setActivePage }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'new-purchase', label: 'New Purchase', icon: '🛒' },
    { id: 'history', label: 'Purchase History', icon: '🧾' },
  ];

  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-logo-icon">👞</div>
        <div className="brand-text">
          <h1>Mogali Footwear</h1>
          <p>Customer Loyalty Management System</p>
        </div>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}

