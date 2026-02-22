import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAdminToken } from '../../Utils/getAuthToken';

const GetAllUsersForAdmin = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const handleGetAllUsers = async () => {
      try {
        const idToken = await getAdminToken();
        const res = await axios.get("/user/getAllUsersForAdmin", {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        setUsers(res.data);
      } catch (error) {
        console.log(error.message);
      }
    };
    handleGetAllUsers();
  }, []);

  // Function to get role-specific styling
  const getRoleStyle = (role) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return {
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          color: '#e74c3c',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      case 'seller':
        return {
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          color: '#3498db',
          padding: '5px 10px',
          borderRadius: '12px',
          fontWeight: '600',
          display: 'inline-block'
        };
      case 'user':
        return {
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          color: '#2ecc71',
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
    <div className="users-container">
      <h1 className="users-header"> User Management</h1>
      
      {/* Desktop Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>UID</th>
              <th>Joined At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.uid || index} className={index % 2 === 0 ? 'even-row' : ''}>
                <td>{index + 1}</td>
                <td>
                  <div className="user-info">
                    <div className="user-avatar">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  <span style={getRoleStyle(user.role)}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className="user-uid">
                    {user.uid}
                  </span>
                </td>
                <td>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
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
        {users.map((user, index) => (
          <div key={user.uid || index} className="mobile-card">
            <div className="mobile-card-header">
              <div className="mobile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="mobile-user-info">
                <div className="mobile-user-name">{user.name}</div>
                <div className="mobile-user-email">{user.email}</div>
              </div>
            </div>
            <div className="mobile-card-content">
              <div className="mobile-field">
                <span className="mobile-field-label">Role:</span>
                <span className="mobile-field-value">
                  <span style={getRoleStyle(user.role)}>{user.role}</span>
                </span>
              </div>
              <div className="mobile-field">
                <span className="mobile-field-label">Joined:</span>
                <span className="mobile-field-value">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="mobile-field">
                <span className="mobile-field-label">UID:</span>
                <span className="mobile-field-value">
                  <span className="mobile-uid">{user.uid}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .users-container {
          padding: 30px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .users-header {
          font-size: 2rem;
          margin-bottom: 30px;
          color: #2c3e50;
          font-weight: 600;
          padding-bottom: 15px;
          border-bottom: 3px solid #3498db;
          display: inline-block;
        }

        .table-container {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .users-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          overflow: hidden;
        }

        .users-table th {
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

        .users-table td {
          padding: 15px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          color: #555;
          vertical-align: middle;
        }

        .users-table tr {
          transition: all 0.2s ease;
        }

        .users-table tr:hover {
          background-color: rgba(52, 152, 219, 0.05);
        }

        .even-row {
          background-color: #f8f9fa;
        }

        .user-info {
          display: flex;
          align-items: center;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #3498db;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-weight: 600;
          font-size: 1rem;
        }

        .user-uid {
          font-family: monospace;
          font-size: 0.85rem;
          color: #7f8c8d;
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
          align-items: center;
          margin-bottom: 12px;
        }

        .mobile-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background-color: #3498db;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .mobile-user-info {
          flex: 1;
        }

        .mobile-user-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 4px;
        }

        .mobile-user-email {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin-bottom: 8px;
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

        .mobile-uid {
          font-family: monospace;
          font-size: 0.8rem;
          color: #7f8c8d;
          word-break: break-all;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .users-container {
            padding: 20px 15px;
          }
          
          .users-header {
            font-size: 1.8rem;
            margin-bottom: 25px;
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
          .users-container {
            padding: 15px 10px;
          }
          
          .users-header {
            font-size: 1.5rem;
            margin-bottom: 20px;
          }
          
          .mobile-avatar {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }
          
          .mobile-user-name {
            font-size: 1rem;
          }
          
          .mobile-user-email {
            font-size: 0.85rem;
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
          
          .mobile-uid {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GetAllUsersForAdmin;