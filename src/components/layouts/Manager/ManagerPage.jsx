// src/components/layouts/manager/ManagerPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import DashboardCard from "./DashboardCard";
import EditableTable from "./EditableTable";
import TransactionTable from "./TransactionTable";
import "./ManagerPage.css";

const ManagerPage = () => {
  const navigate = useNavigate();
  
  // TODO: Get this from login/auth context later
  // For now, you can change this to test different managers
  const managerEmail = "giftshop.manager@themepark.com";
  
  // All state - NO hardcoded data
  const [managerInfo, setManagerInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    staff: [],
    inventory: [],
    sales: { today: 0, week: 0, month: 0 }
  });
  const [staffDetails, setStaffDetails] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reportType, setReportType] = useState("");

  const API_BASE = "http://localhost:5000"; // to match the server port

  // Fetch manager info on component mount
  useEffect(() => {
    fetchManagerInfo();
  }, []);

  // Fetch all dashboard data when manager info is loaded
  useEffect(() => {
    if (managerInfo && managerInfo.department) {
      fetchAllData();
    }
  }, [managerInfo]);

  const fetchManagerInfo = async () => {
  try {
    console.log("Fetching manager info for:", managerEmail);
    console.log("API URL:", `${API_BASE}/manager-info/${managerEmail}`);
    
    const res = await fetch(`${API_BASE}/manager-info/${managerEmail}`);
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("Manager data received:", data);
    
    if (data.error) {
      setError(data.error);
      setLoading(false);
      return;
    }
    
    setManagerInfo(data);
    setLoading(false);
  } catch (err) {
    console.error("Error fetching manager info:", err);
    setError(`Failed to connect to server: ${err.message}`);
    setLoading(false);
  }
};
  const fetchAllData = async () => {
    if (!managerInfo) return;
    
    setLoading(true);
    const dept = managerInfo.department;
    
    try {
      // Fetch all data in parallel
      const [dashRes, staffRes, transRes, stockRes, topRes] = await Promise.all([
        fetch(`${API_BASE}/manager/${dept}`),
        fetch(`${API_BASE}/manager/${dept}/staff-details`),
        fetch(`${API_BASE}/manager/${dept}/recent-transactions`),
        fetch(`${API_BASE}/manager/${dept}/low-stock`),
        fetch(`${API_BASE}/manager/${dept}/top-items`)
      ]);

      // Check if all requests succeeded
      if (!dashRes.ok || !staffRes.ok || !transRes.ok || !stockRes.ok || !topRes.ok) {
        throw new Error('One or more API requests failed');
      }

      const dashData = await dashRes.json();
      const staffData = await staffRes.json();
      const transData = await transRes.json();
      const stockData = await stockRes.json();
      const topData = await topRes.json();

      // Update all state with database data
      setDashboardData(dashData);
      setStaffDetails(staffData);
      setRecentTransactions(transData);
      setLowStock(stockData);
      setTopItems(topData);
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(`Failed to load dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = () => {
    if (!managerInfo) return "";
    const dept = managerInfo.department;
    if (dept === "giftshop") return "Gift Shop";
    if (dept === "foodanddrinks") return "Food & Beverages";
    if (dept === "maintenance") return "Maintenance";
    return dept;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const handleAddItem = () => {
    setShowAddModal(true);
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      // TODO: Implement delete API endpoint
      alert("Delete functionality - will be connected to backend API");
      // After successful delete, refresh the data
      fetchAllData();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleGenerateReport = (type) => {
    setReportType(type);
    setShowReportModal(true);
  };

  // Loading state
  if (loading && !managerInfo) {
    return (
      <div className="manager-layout">
        <div className="loading-container">
          <p>Loading manager information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !managerInfo) {
    return (
      <div className="manager-layout">
        <div className="loading-container">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>Error Loading Manager Data</h2>
            <p style={{ marginBottom: "0.5rem", color: "#2d3748" }}>{error}</p>
            <p style={{ fontSize: "0.9rem", color: "#66bb6a", marginTop: "1rem" }}>
              Troubleshooting:
            </p>
            <ul style={{ fontSize: "0.875rem", color: "#5a6c57", textAlign: "left", maxWidth: "400px", margin: "0.5rem auto" }}>
              <li>Make sure backend server is running on http://localhost:5000</li>
              <li>Check that the database is running</li>
              <li>Verify manager exists in database with email: {managerEmail}</li>
            </ul>
            <button 
              onClick={() => navigate("/")}
              className="add-button"
              style={{ marginTop: "1.5rem" }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No manager found
  if (!managerInfo) {
    return (
      <div className="manager-layout">
        <div className="loading-container">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#2e7d32", marginBottom: "1rem" }}>Manager Not Found</h2>
            <p style={{ marginBottom: "0.5rem" }}>No manager found with email: {managerEmail}</p>
            <p style={{ fontSize: "0.875rem", color: "#66bb6a", marginTop: "1rem" }}>
              Please add a manager to the database or check the email address.
            </p>
            <button 
              onClick={() => navigate("/")}
              className="add-button"
              style={{ marginTop: "1rem" }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isMaintenance = managerInfo.department === "maintenance";

  return (
    <div className="manager-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} managerInfo={managerInfo} />
      
      <main className="manager-content">
        {activeTab === "overview" && (
          <>
            <header className="manager-header">
              <div>
                <h1>{getDepartmentName()} Manager Dashboard</h1>
                <p>Welcome back, {managerInfo.first_name}</p>
              </div>
            </header>

            <section className="overview-section">
              <div className="card-grid">
                <DashboardCard 
                  title="Today's Revenue" 
                  value={formatCurrency(dashboardData.sales?.today || 0)} 
                  badge="Today"
                />
                <DashboardCard 
                  title="Weekly Revenue" 
                  value={formatCurrency(dashboardData.sales?.week || 0)} 
                  badge="This Week"
                />
                <DashboardCard 
                  title="Monthly Revenue" 
                  value={formatCurrency(dashboardData.sales?.month || 0)} 
                  badge="This Month"
                />
                <DashboardCard 
                  title={isMaintenance ? "Active Jobs" : "Low Stock Items"} 
                  value={isMaintenance 
                    ? recentTransactions.filter(t => t.status !== "completed").length 
                    : lowStock.length
                  }
                  alert={!isMaintenance && lowStock.length > 0}
                />
              </div>

              {/* Reports Section */}
              <div className="section-card" style={{ marginBottom: "2rem" }}>
                <h3>Data Reports</h3>
                <p style={{ color: "#66bb6a", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  Generate formatted reports from multiple database tables
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <button 
                    className="report-button"
                    onClick={() => handleGenerateReport("sales")}
                  >
                    Sales Report
                  </button>
                  <button 
                    className="report-button"
                    onClick={() => handleGenerateReport("inventory")}
                  >
                    Inventory Status Report
                  </button>
                  <button 
                    className="report-button"
                    onClick={() => handleGenerateReport("staff")}
                  >
                    Staff Performance Report
                  </button>
                </div>
              </div>

              {/* Top Items / Staff Overview */}
              <div className="two-column-grid">
                {!isMaintenance && topItems.length > 0 && (
                  <div className="section-card">
                    <h3>Top Selling Items</h3>
                    <div className="items-list">
                      {topItems.map((item, idx) => (
                        <div key={idx} className="item-row">
                          <div className="item-info">
                            <span className="item-rank">{idx + 1}</span>
                            <div>
                              <p className="item-name">{item.name}</p>
                              <p className="item-meta">{item.total_sold} units sold</p>
                            </div>
                          </div>
                          <span className="item-value">{formatCurrency(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="section-card">
                  <h3>Staff Overview</h3>
                  {staffDetails.length > 0 ? (
                    <div className="items-list">
                      {staffDetails.slice(0, 5).map((staff, idx) => (
                        <div key={idx} className="item-row">
                          <div className="item-info">
                            <div className="staff-avatar">
                              {staff.first_name?.[0]}{staff.last_name?.[0]}
                            </div>
                            <div>
                              <p className="item-name">{staff.first_name} {staff.last_name}</p>
                              <p className="item-meta">{staff.job_title}</p>
                            </div>
                          </div>
                          <span className="item-meta">
                            {isMaintenance ? `${staff.active_jobs || 0} jobs` : `${staff.stores_assigned || 0} stores`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#66bb6a", fontSize: "0.9rem" }}>No staff members found for this department.</p>
                  )}
                </div>
              </div>

              {/* Low Stock Alert */}
              {!isMaintenance && lowStock.length > 0 && (
                <div className="alert-section">
                  <h3>Low Stock Alert</h3>
                  <div className="alert-grid">
                    {lowStock.map((item, idx) => (
                      <div key={idx} className="alert-card">
                        <p className="alert-item-name">{item.name}</p>
                        <p className="alert-store">{item.store_name}</p>
                        <p className="alert-quantity">Only {item.quantity} left</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "staff" && (
          <section className="staff-section scrollable">
            <div className="section-header">
              <h2>Staff Management</h2>
              <button className="add-button" onClick={handleAddItem}>
                + Add Staff
              </button>
            </div>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid rgba(46, 125, 50, 0.08)" }}>
              <input
                type="text"
                placeholder="Search staff by name or job title..."
                className="search-bar"
                value={staffSearchQuery}
                onChange={(e) => setStaffSearchQuery(e.target.value)}
              />
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Job Title</th>
                  <th>{isMaintenance ? "Active Jobs" : "Assigned Stores"}</th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffDetails.length > 0 ? (
                  staffDetails
                    .filter(staff => 
                      `${staff.first_name} ${staff.last_name}`.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                      staff.job_title?.toLowerCase().includes(staffSearchQuery.toLowerCase())
                    )
                    .map((staff, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="staff-cell">
                          <div className="staff-avatar-small">
                            {staff.first_name?.[0]}{staff.last_name?.[0]}
                          </div>
                          {staff.first_name} {staff.last_name}
                        </div>
                      </td>
                      <td>{staff.job_title}</td>
                      <td>
                        <span className="badge">
                          {isMaintenance ? `${staff.active_jobs || 0} jobs` : `${staff.stores_assigned || 0} stores`}
                        </span>
                      </td>
                      <td className="details-cell">{staff.store_names || staff.job_statuses || "N/A"}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleEditItem(staff)}
                          >
                            Edit
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteItem(staff.employee_id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#66bb6a" }}>
                      No staff members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === "inventory" && !isMaintenance && (
          <section className="inventory-section scrollable">
            <div className="section-header">
              <h2>Inventory Management</h2>
              <button className="add-button" onClick={handleAddItem}>
                + Add Product
              </button>
            </div>
            {dashboardData.inventory && dashboardData.inventory.length > 0 ? (
              <EditableTable 
                data={dashboardData.inventory.map(item => ({
                  id: item.item_id,
                  name: item.item_name,
                  store: item.store_name,
                  quantity: item.quantity,
                  price: item.price,
                  type: item.type
                }))} 
                searchable={true}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", color: "#66bb6a" }}>
                No inventory items found
              </div>
            )}
          </section>
        )}

        {activeTab === "transactions" && (
          <section className="transactions-section scrollable">
            <div className="section-header">
              <h2>{isMaintenance ? "Maintenance Jobs" : "Transaction History"}</h2>
              {isMaintenance && (
                <button className="add-button" onClick={handleAddItem}>
                  + New Maintenance Job
                </button>
              )}
            </div>

            {!isMaintenance && (
              <div className="transaction-cards">
                <DashboardCard 
                  title="Total Revenue" 
                  value={formatCurrency(dashboardData.sales?.month || 0)} 
                />
                <DashboardCard 
                  title="Total Transactions" 
                  value={recentTransactions.length} 
                />
                <DashboardCard 
                  title="Average Order" 
                  value={recentTransactions.length > 0 
                    ? formatCurrency(recentTransactions.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) / recentTransactions.length)
                    : "$0.00"
                  } 
                />
              </div>
            )}

            {recentTransactions.length > 0 ? (
              <TransactionTable 
                data={recentTransactions.map(trans => ({
                  id: trans.store_order_id,
                  date: formatDate(trans.order_date),
                  customer: trans.store_name,
                  total: parseFloat(trans.total_amount || 0),
                  status: `${trans.item_count} items`
                }))} 
                searchable={true} 
              />
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", color: "#66bb6a", background: "white", borderRadius: "0 0 20px 20px" }}>
                No transactions found
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modals */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{showAddModal ? "Add New Item" : "Edit Item"}</h2>
            <p style={{ color: "#66bb6a", marginBottom: "1rem" }}>
              Data entry form will be connected to backend API
            </p>
            <button 
              className="add-button"
              onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h2>
            <p style={{ color: "#66bb6a", marginBottom: "1rem" }}>
              Report data from database tables will display here
            </p>
            <button 
              className="add-button"
              onClick={() => setShowReportModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerPage;