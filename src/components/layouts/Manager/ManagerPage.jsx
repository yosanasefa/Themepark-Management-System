import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../login/AuthContext";
import Sidebar from "./Sidebar";
import DashboardCard from "./DashboardCard";
import EditableTable from "./EditableTable";
import TransactionTable from "./TransactionTable";
import "./ManagerPage.css";

const ManagerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [managerInfo, setManagerInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState({
    staff: [],
    inventory: [],
    sales: { today: 0, week: 0, month: 0 }
  });
  const [salesEmployees, setSalesEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [availableMerchandise, setAvailableMerchandise] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = "http://localhost:5000";
  
  const managerEmail = user?.email || 
                        location.state?.employee?.email || 
                        JSON.parse(localStorage.getItem('user'))?.email;

  useEffect(() => {
    if (location.state?.employee) {
      setManagerInfo({
        ...location.state.employee,
        department: location.state.employee.role
      });
      setLoading(false);
    } else if (managerEmail) {
      fetchManagerInfo();
    } else {
      navigate('/login');
    }
  }, []);

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
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    if (!managerInfo) return;
    
    setLoading(true);
    const dept = managerInfo.department;
    
    try {
      const [dashRes, employeesRes, storesRes, merchandiseRes] = await Promise.all([
        fetch(`${API_BASE}/manager/${dept}`),
        fetch(`${API_BASE}/manager/${dept}/sales-employees`),
        fetch(`${API_BASE}/manager/${dept}/stores`),
        fetch(`${API_BASE}/manager/${dept}/available-merchandise`)
      ]);

      const dashData = await dashRes.json();
      const employeesData = await employeesRes.json();
      const storesData = await storesRes.json();
      const merchandiseData = await merchandiseRes.json();

      setDashboardData(dashData);
      setSalesEmployees(employeesData);
      setStores(storesData);
      setAvailableMerchandise(merchandiseData);
    } catch (err) {
      console.error("Error fetching data:", err);
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

  if (loading) {
    return (
      <div className="manager-layout">
        <div className="loading-container">
          <p>Loading manager information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manager-layout">
        <div className="loading-container">
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "#dc2626", marginBottom: "1rem" }}>Error Loading Manager Data</h2>
            <p style={{ marginBottom: "0.5rem" }}>Error: {error}</p>
            <p style={{ fontSize: "0.9rem", color: "#66785F" }}>
              Email used: {managerEmail}
            </p>
            <button 
              onClick={() => navigate("/")}
              className="btn-primary mt-4"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!managerInfo) {
    return (
      <div className="manager-layout">
        <div className="loading-container">
          <p>No manager found with email: {managerEmail}</p>
          <button 
            onClick={() => navigate("/")}
            className="btn-primary mt-4"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manager-layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        managerInfo={managerInfo} 
      />
      
      <main className="manager-content">
        {activeTab === "overview" && (
          <>
            <header className="manager-header glass">
              <div>
                <h1>{getDepartmentName()} Manager Dashboard</h1>
                <p>Welcome back, {managerInfo.first_name}</p>
              </div>
            </header>

            <section className="overview-section">
              <div className="card-grid">
                <DashboardCard 
                  title="Today's Revenue" 
                  value={formatCurrency(dashboardData.sales.today)} 
                  badge="Today"
                />
                <DashboardCard 
                  title="Weekly Revenue" 
                  value={formatCurrency(dashboardData.sales.week)} 
                  badge="This Week"
                />
                <DashboardCard 
                  title="Monthly Revenue" 
                  value={formatCurrency(dashboardData.sales.month)} 
                  badge="This Month"
                />
                <DashboardCard 
                  title="Sales Employees" 
                  value={salesEmployees.length}
                  badge="Active"
                />
              </div>
            </section>
          </>
        )}

        {activeTab === "employees" && (
          <section className="employees-section glass scrollable">
            <div className="section-header">
              <h2>Manage Sales Employees</h2>
              <button className="add-button">
                + Assign Employee
              </button>
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Assigned Stores</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesEmployees.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td>
                      <div className="staff-cell">
                        <div className="staff-avatar-small">
                          {employee.first_name?.[0]}{employee.last_name?.[0]}
                        </div>
                        {employee.first_name} {employee.last_name}
                      </div>
                    </td>
                    <td>{employee.email}</td>
                    <td>{employee.phone}</td>
                    <td>{employee.assigned_stores || "Not assigned"}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn edit-btn">
                          Assign Stores
                        </button>
                        <button className="action-btn delete-btn">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === "inventory" && (
          <section className="inventory-section glass scrollable">
            <div className="section-header">
              <h2>Manage Store Inventory</h2>
              <button className="add-button">
                + Add to Store
              </button>
            </div>
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
            />
          </section>
        )}

        {activeTab === "schedules" && (
          <section className="schedules-section glass scrollable">
            <div className="section-header">
              <h2>Employee Schedules</h2>
              <button className="add-button">
                + Create Schedule
              </button>
            </div>
            
            <div className="schedule-calendar">
              <p className="text-gray-600">Schedule management coming soon...</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ManagerPage;