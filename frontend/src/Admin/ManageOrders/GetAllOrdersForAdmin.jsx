
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { getAdminToken } from '../../Utils/getAuthToken';

const statuses = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancel', 'Delayed'];

const GetAllOrdersForAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [page, setPage] = useState(1);

  // Filters & controls
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter] = useState('All');
  const [yearFilter, setYearFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');
  const [priceMinFilter, setPriceMinFilter] = useState('');
  const [priceMaxFilter, setPriceMaxFilter] = useState('');
  const [priceSort, setPriceSort] = useState('None');
  const [searchTerm, setSearchTerm] = useState('');

  // Unique cities for dropdown (from loaded orders)
  const uniqueCities = [...new Set(orders.map(o => o.shippingCity).filter(Boolean))];

  // Years for filter dropdown (last 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Fetch orders from backend with filters and pagination
  const fetchOrders = async () => {
    try {
      const idToken = await getAdminToken();

    const priceMinNum = priceMinFilter ? Number(priceMinFilter) : undefined;
    const priceMaxNum = priceMaxFilter ? Number(priceMaxFilter) : undefined;

      const params = {
        page,
        limit: 10,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        city: cityFilter !== 'All' ? cityFilter : undefined,
        year: yearFilter !== 'All' ? yearFilter : undefined,
        month: monthFilter !== 'All' ? monthFilter : undefined,
        priceMin: priceMinNum,
        priceMax: priceMaxNum,
        priceSort: priceSort !== 'None' ? priceSort : undefined,
        search: searchTerm || undefined,
      };

      // Clean undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const res = await axios.get('/order/getAllOrdersForAdmin', {
        headers: { Authorization: `Bearer ${idToken}` },
        params,
      });
      setOrders(res.data.orders);
      console.log(res.data)
      setTotalPages(res.data.totalPages);
      setTotalOrders(res.data.totalOrders);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, cityFilter, yearFilter, monthFilter, priceMinFilter, priceMaxFilter, priceSort, searchTerm]);

  // Update order status
  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      const idToken = await getAdminToken();
      await axios.post(
        '/order/updateOrderStatus',
        { orderId, newStatus },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      // Update status locally to reflect immediately
      setOrders(prev =>
        prev.map(order => (order._id === orderId ? { ...order, status: newStatus } : order))
      );
    } catch (error) {
      console.error('Error updating status:', error.message);
    }
  };

  // Function to get status-specific styling
  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return {
          backgroundColor: 'rgba(255, 193, 7, 0.2)',
          color: '#ffc107',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      case 'confirmed':
        return {
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          color: '#3498db',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      case 'shipped':
        return {
          backgroundColor: 'rgba(155, 89, 182, 0.2)',
          color: '#9b59b6',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      case 'delivered':
        return {
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          color: '#2ecc71',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      case 'cancel':
        return {
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          color: '#e74c3c',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      case 'delayed':
        return {
          backgroundColor: 'rgba(243, 156, 18, 0.2)',
          color: '#f39c12',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      default:
        return {
          backgroundColor: 'rgba(149, 165, 166, 0.2)',
          color: '#95a5a6',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
    }
  };

  return (
    <div className="orders-container">
      <h1 className="orders-header"> Order Management</h1>
      
      {/* Search input */}
      <input
        type="text"
        placeholder="Search by user or city..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="search-box"
      />

      {/* Filter Controls */}
      <div className="filters-container">
        <select 
          value={statusFilter} 
          onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
          className="filter-select"
        >
          <option value="All">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select 
          value={cityFilter} 
          onChange={e => { setPage(1); setCityFilter(e.target.value); }}
          className="filter-select"
        >
          <option value="All">All Cities</option>
          {uniqueCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select 
          value={yearFilter} 
          onChange={e => { setPage(1); setYearFilter(e.target.value); }}
          className="filter-select"
        >
          <option value="All">All Years</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select 
          value={monthFilter} 
          onChange={e => { setPage(1); setMonthFilter(e.target.value); }}
          className="filter-select"
        >
          <option value="All">All Months</option>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
            <option key={m} value={m}>
              {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min Price"
          min="0"
          value={priceMinFilter}
          onChange={e => { setPage(1); setPriceMinFilter(e.target.value); }}
          className="number-input"
        />

        <input
          type="number"
          placeholder="Max Price"
          min="0"
          value={priceMaxFilter}
          onChange={e => { setPage(1); setPriceMaxFilter(e.target.value); }}
          className="number-input"
        />

        <select 
          value={priceSort} 
          onChange={e => { setPage(1); setPriceSort(e.target.value); }}
          className="filter-select"
        >
          <option value="None">Sort by Price</option>
          <option value="asc">Price Low to High</option>
          <option value="desc">Price High to Low</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found matching your criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Order ID</th>
                  <th>Guest</th>
                  <th>Status</th>
                  <th>City</th>
                  <th>Amount</th>
                  <th>User UID</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id} className={index % 2 === 0 ? 'even-row' : ''}>
                    <td>{index + 1}</td>
                    <td>
                      <span className="order-id">{order._id}</span>
                    </td>
                    <td>
                      {order.isGuest === true ? (
                        <span className="guest-badge">Guest</span>
                      ) : (
                        <span className="registered-badge">Registered</span>
                      )}
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={e => handleOrderStatus(order._id, e.target.value)}
                        className="status-select"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="city-badge">
                        {order.shippingCity || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="amount">${order.totalAmount}</span>
                    </td>
                    <td>
                      <span className="order-id">
                        {order.user}
                      </span>
                    </td>
                    <td>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="mobile-cards">
            {orders.map((order, index) => (
              <div key={order._id} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="order-number">#{index + 1}</div>
                  <div className="order-status">
                    <select
                      value={order.status}
                      onChange={e => handleOrderStatus(order._id, e.target.value)}
                      className="mobile-status-select"
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mobile-card-content">
                  <div className="mobile-field">
                    <span className="mobile-field-label">Order ID:</span>
                    <span className="mobile-field-value">
                      <span className="mobile-order-id">{order._id}</span>
                    </span>
                  </div>
                  <div className="mobile-field">
                    <span className="mobile-field-label">Type:</span>
                    <span className="mobile-field-value">
                      {order.isGuest === true ? (
                        <span className="mobile-guest-badge">Guest</span>
                      ) : (
                        <span className="mobile-registered-badge">Registered</span>
                      )}
                    </span>
                  </div>
                  <div className="mobile-field">
                    <span className="mobile-field-label">City:</span>
                    <span className="mobile-field-value">
                      <span className="mobile-city-badge">
                        {order.shippingCity || 'N/A'}
                      </span>
                    </span>
                  </div>
                  <div className="mobile-field">
                    <span className="mobile-field-label">Amount:</span>
                    <span className="mobile-field-value">
                      <span className="mobile-amount">${order.totalAmount}</span>
                    </span>
                  </div>
                  <div className="mobile-field">
                    <span className="mobile-field-label">User UID:</span>
                    <span className="mobile-field-value">
                      <span className="mobile-order-id">{order.user}</span>
                    </span>
                  </div>
                  <div className="mobile-field">
                    <span className="mobile-field-label">Created:</span>
                    <span className="mobile-field-value">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .orders-container {
          padding: 30px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .orders-header {
          font-size: 2rem;
          margin-bottom: 30px;
          color: #2c3e50;
          font-weight: 600;
          padding-bottom: 15px;
          border-bottom: 3px solid #3498db;
          display: inline-block;
        }

        .search-box {
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          margin-bottom: 20px;
          width: 300px;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s;
        }

        .search-box:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
        }

        .filters-container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .filter-select, .number-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s;
          cursor: pointer;
        }

        .number-input {
          width: 100px;
          cursor: text;
        }

        .filter-select:focus, .number-input:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .table-container {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .orders-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
        }

        .orders-table th {
          background-color: #2c3e50;
          color: white;
          padding: 18px 15px;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.85rem;
          position: sticky;
          top: 0;
        }

        .orders-table td {
          padding: 15px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          color: #555;
          vertical-align: middle;
        }

        .orders-table tr {
          transition: all 0.2s ease;
        }

        .orders-table tr:hover {
          background-color: rgba(52, 152, 219, 0.05);
        }

        .even-row {
          background-color: #f8f9fa;
        }

        .status-select {
          padding: 5px 10px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-size: 0.85rem;
          outline: none;
          transition: all 0.3s;
          cursor: pointer;
        }

        .status-select:focus {
          border-color: #3498db;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }

        .guest-badge {
          background-color: rgba(231, 76, 60, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
        }

        .registered-badge {
          background-color: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
        }

        .order-id {
          font-family: monospace;
          font-size: 0.85rem;
          color: #7f8c8d;
        }

        .amount {
          font-weight: 600;
          color: #27ae60;
        }

        .city-badge {
          background-color: rgba(52, 152, 219, 0.1);
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .no-orders {
          text-align: center;
          padding: 60px 20px;
          color: #7f8c8d;
          font-size: 1.2rem;
          font-style: italic;
        }

        /* Mobile Cards */
        .mobile-cards {
          display: none;
        }

        .mobile-card {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .mobile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .order-number {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
        }

        .mobile-status-select {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #ddd;
          font-size: 0.85rem;
          outline: none;
          background-color: #f8f9fa;
        }

        .mobile-card-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          font-size: 0.9rem;
        }

        .mobile-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .mobile-field-label {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mobile-field-value {
          color: #555;
          text-align: right;
        }

        .mobile-order-id {
          font-family: monospace;
          font-size: 0.8rem;
          color: #7f8c8d;
          word-break: break-all;
        }

        .mobile-guest-badge {
          background-color: rgba(231, 76, 60, 0.9);
          color: white;
          padding: 3px 6px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .mobile-registered-badge {
          background-color: rgba(46, 204, 113, 0.2);
          color: #2ecc71;
          padding: 3px 6px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .mobile-city-badge {
          background-color: rgba(52, 152, 219, 0.1);
          padding: 3px 6px;
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .mobile-amount {
          font-weight: 600;
          color: #27ae60;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .orders-container {
            padding: 20px 15px;
          }
          
          .orders-header {
            font-size: 1.8rem;
            margin-bottom: 25px;
          }
          
          .search-box {
            width: 100%;
            max-width: 300px;
          }
          
          .filters-container {
            flex-direction: column;
            gap: 8px;
          }
          
          .filter-select, .number-input {
            width: 100%;
          }
          
          .table-container {
            display: none;
          }
          
          .mobile-cards {
            display: block;
          }
          
          .mobile-card-content {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 0.9rem;
          }
        }

        @media (max-width: 480px) {
          .orders-container {
            padding: 15px 10px;
          }
          
          .orders-header {
            font-size: 1.5rem;
            margin-bottom: 20px;
          }
          
          .mobile-card-content {
            grid-template-columns: 1fr;
            gap: 8px;
            font-size: 0.85rem;
          }
          
          .mobile-field-label {
            font-size: 0.8rem;
          }
          
          .mobile-field-value {
            font-size: 0.8rem;
          }
          
          .mobile-order-id {
            font-size: 0.75rem;
          }
          
          .mobile-guest-badge, .mobile-registered-badge {
            font-size: 0.65rem;
          }
          
          .mobile-city-badge {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GetAllOrdersForAdmin;
