import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdDashboard, MdPeople, MdInventory, MdSchedule } from "react-icons/md";
import "./ManagerPage.css";

// Sidebar Component
const Sidebar = ({ activeTab, setActiveTab, managerInfo, onLogout }) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: MdDashboard },
    { id: "employees", label: "Employees", icon: MdPeople },
    { id: "inventory", label: "Inventory", icon: MdInventory },
    { id: "schedules", label: "Schedules", icon: MdSchedule },
  ];

  const getDepartmentName = () => {
    if (!managerInfo) return "";
    const dept = managerInfo.department;
    if (dept === "giftshop") return "Gift Shop";
    if (dept === "foodanddrinks") return "Food & Beverages";
    return dept;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">ThemePark</h2>
        {managerInfo && (
          <p className="sidebar-subtitle">{getDepartmentName()} Manager</p>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {managerInfo && (
        <>
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {managerInfo.first_name?.[0]}{managerInfo.last_name?.[0]}
            </div>
            <div className="profile-info">
              <p className="profile-name">
                {managerInfo.first_name} {managerInfo.last_name}
              </p>
              <p className="profile-title">{managerInfo.job_title}</p>
            </div>
          </div>
          
          <button className="logout-button" onClick={onLogout}>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button>
        </>
      )}
    </aside>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, value, badge, alert }) => {
  return (
    <div className={`dashboard-card ${alert ? "alert-card" : ""}`}>
      {badge && <span className="card-badge">{badge}</span>}
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
};

// Main Manager Page Component
const ManagerPage = () => {
  const navigate = useNavigate();
  
  // Get manager email from localStorage or use default
  const managerEmail = JSON.parse(localStorage.getItem('user'))?.email || "sarah.giftshop@themepark.com";
  
  // State management
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
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  const API_BASE = "http://localhost:3001";

  // Fetch manager info on mount
  useEffect(() => {
    fetchManagerInfo();
  }, []);

  // Fetch dashboard data when manager info loads
  useEffect(() => {
    if (managerInfo && managerInfo.department) {
      fetchAllData();
    }
  }, [managerInfo]);

  const fetchManagerInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/manager-info/${managerEmail}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
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
    const [dashRes, staffRes, salesEmpRes, transRes, stockRes, topRes] = await Promise.all([
      fetch(`${API_BASE}/manager/${dept}`),
      fetch(`${API_BASE}/manager/${dept}/staff-details`),
      fetch(`${API_BASE}/manager/${dept}/sales-employees`), // NEW
      fetch(`${API_BASE}/manager/${dept}/recent-transactions`),
      fetch(`${API_BASE}/manager/${dept}/low-stock`),
      fetch(`${API_BASE}/manager/${dept}/top-items`)
    ]);

    if (!dashRes.ok || !staffRes.ok || !salesEmpRes.ok || !transRes.ok || !stockRes.ok || !topRes.ok) {
      throw new Error('One or more API requests failed');
    }

    const dashData = await dashRes.json();
    const staffData = await staffRes.json();
    const salesEmpData = await salesEmpRes.json(); // NEW
    const transData = await transRes.json();
    const stockData = await stockRes.json();
    const topData = await topRes.json();

    setDashboardData(dashData);
    setStaffDetails(salesEmpData); // Use sales employees for the Employees tab
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

  const handleAddItem = (type) => {
    setModalType(type);
    setSelectedItem(null);
    setShowModal(true);
  };

  const handleEditItem = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setShowModal(true);
  };

  const handleDeleteItem = async (itemId, type) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      alert(`Delete ${type} functionality will be connected to backend API`);
      fetchAllData();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(`Failed to delete: ${err.message}`);
    }
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
              <li>Make sure backend server is running on {API_BASE}</li>
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

  return (
    <div className="manager-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} managerInfo={managerInfo} />
      
      <main className="manager-content">
        {/* OVERVIEW TAB */}
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
                  title="Low Stock Items" 
                  value={lowStock.length}
                  alert={lowStock.length > 0}
                />
              </div>

              {/* Data Reports Section */}
              <div className="section-card" style={{ marginBottom: "2rem" }}>
                <h3>Data Reports</h3>
                <p style={{ color: "#66bb6a", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  Generate formatted reports from multiple database tables
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  <button className="report-button">Sales Report</button>
                  <button className="report-button">Inventory Status Report</button>
                  <button className="report-button">Staff Performance Report</button>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="two-column-grid">
                {topItems.length > 0 && (
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
                            {staff.stores_assigned || 0} stores
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: "#66bb6a", fontSize: "0.9rem" }}>No staff members found.</p>
                  )}
                </div>
              </div>

              {/* Low Stock Alert */}
              {lowStock.length > 0 && (
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

        {/* EMPLOYEES TAB */}
        {activeTab === "employees" && (
          <section className="staff-section scrollable">
            <div className="section-header">
              <h2>Manage Sales Employees</h2>
              <button className="add-button" onClick={() => handleAddItem("employee")}>
                + Assign Employee
              </button>
            </div>
            
            <div style={{ padding: "1.5rem", background: "white", borderBottom: "1px solid rgba(46, 125, 50, 0.08)" }}>
              <input
                type="text"
                placeholder="Search employees by name..."
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
                  <th>Assigned Stores</th>
                  <th>Store Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffDetails.length > 0 ? (
                  staffDetails
                    .filter(staff => 
                      `${staff.first_name} ${staff.last_name}`.toLowerCase().includes(staffSearchQuery.toLowerCase())
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
                            {staff.stores_assigned || 0} stores
                          </span>
                        </td>
                        <td className="details-cell">{staff.store_names || "Not assigned"}</td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => handleEditItem(staff, "employee")}
                            >
                              Assign Stores
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteItem(staff.employee_id, "employee")}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#66bb6a" }}>
                      No sales employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <section className="inventory-section scrollable">
            <div className="section-header">
              <h2>Manage Store Inventory</h2>
              <button className="add-button" onClick={() => handleAddItem("inventory")}>
                + Add to Store
              </button>
            </div>

            {dashboardData.inventory && dashboardData.inventory.length > 0 ? (
              <>
                <div style={{ padding: "1.5rem", background: "white", borderBottom: "1px solid rgba(46, 125, 50, 0.08)" }}>
                  <input
                    type="text"
                    placeholder="Search inventory by item name or store..."
                    className="search-bar"
                    value={inventorySearchQuery}
                    onChange={(e) => setInventorySearchQuery(e.target.value)}
                  />
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Store</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.inventory
                      .filter(item => 
                        item.item_name.toLowerCase().includes(inventorySearchQuery.toLowerCase()) ||
                        item.store_name.toLowerCase().includes(inventorySearchQuery.toLowerCase())
                      )
                      .map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.item_name}</td>
                          <td>{item.store_name}</td>
                          <td>
                            <span className="badge">{item.type}</span>
                          </td>
                          <td>
                            <span className={item.quantity < 20 ? "badge" : ""} 
                                  style={item.quantity < 20 ? {background: "rgba(255, 152, 0, 0.1)", color: "#f57c00"} : {}}>
                              {item.quantity}
                            </span>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="action-btn edit-btn"
                                onClick={() => handleEditItem(item, "inventory")}
                              >
                                Edit
                              </button>
                              <button 
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteItem(item.item_id, "inventory")}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div style={{ padding: "3rem", textAlign: "center", color: "#66bb6a", background: "white", borderRadius: "0 0 20px 20px" }}>
                No inventory items found
              </div>
            )}
          </section>
        )}

        {/* SCHEDULES TAB */}
        {activeTab === "schedules" && (
          <section className="inventory-section scrollable">
            <div className="section-header">
              <h2>Employee Schedules</h2>
              <button className="add-button" onClick={() => handleAddItem("schedule")}>
                + Create Schedule
              </button>
            </div>
            
            <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "0 0 20px 20px" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "1rem" }}></p>
              <p style={{ fontSize: "1.125rem", color: "#afd69b", marginBottom: "1rem", fontWeight: "600" }}>
                Schedule Management
              </p>
              <p style={{ color: "#66bb6a", maxWidth: "500px", margin: "0 auto" }}>
                Create and manage employee work schedules for {getDepartmentName()}.<br/>
                Assign shifts, track hours, and ensure proper store coverage.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedItem ? "Edit" : "Add"} {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h2>
            <p style={{ color: "#66bb6a", marginBottom: "1rem" }}>
              {modalType === "employee" && "Assign employees to specific stores"}
              {modalType === "inventory" && "Add or update merchandise in store inventory"}
              {modalType === "schedule" && "Create work schedules for your employees"}
            </p>
            <p style={{ fontSize: "0.875rem", color: "#5a6c57" }}>
              Form will be connected to backend API
            </p>
            <button 
              className="add-button"
              onClick={() => setShowModal(false)}
              style={{ marginTop: "1rem" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
const handleLogout = () => {
  // Clear user data from localStorage
  localStorage.removeItem('user');
  
  // Redirect to login page
  navigate('/login');
};
export default ManagerPage;