import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import NewPurchase from './pages/NewPurchase';
import PurchaseHistory from './pages/PurchaseHistory';
import './App.css';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [preselectedCustomerId, setPreselectedCustomerId] = useState('');

  const handleSelectCustomerForPurchase = (customerId) => {
    setPreselectedCustomerId(customerId);
    setActivePage('new-purchase');
  };

  return (
    <div className="app-container">
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-wrapper">
        {activePage === 'dashboard' && (
          <Dashboard
            setActivePage={setActivePage}
            setSelectedCustomerId={setPreselectedCustomerId}
          />
        )}

        {activePage === 'customers' && (
          <Customers
            setActivePage={setActivePage}
            onSelectCustomerForPurchase={handleSelectCustomerForPurchase}
          />
        )}

        {activePage === 'new-purchase' && (
          <NewPurchase
            setActivePage={setActivePage}
            preselectedCustomerId={preselectedCustomerId}
          />
        )}

        {activePage === 'history' && (
          <PurchaseHistory
            setActivePage={setActivePage}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div>
            <strong>Mogali Footwear</strong> — Customer Loyalty Management System
          </div>
          <div>
            B.Tech DBMS Project • Node.js, Express, MongoDB & React
          </div>
        </div>
      </footer>
    </div>
  );
}

