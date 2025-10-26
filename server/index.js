import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Pool (like your working db.js)
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "zo7RoDO&r+",
  database: process.env.DB_NAME || "themepark",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection
pool.getConnection()
  .then(conn => {
    console.log("✅ MySQL Connected");
    conn.release();
  })
  .catch(err => {
    console.error("❌ MySQL Connection Error:", err.message);
  });

// Get manager info by email
app.get("/manager-info/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const [rows] = await pool.query(
      `SELECT e.employee_id, e.first_name, e.last_name, e.job_title, e.email,
        CASE
          WHEN e.job_title LIKE '%gift%' THEN 'giftshop'
          WHEN e.job_title LIKE '%food%' OR e.job_title LIKE '%drink%' THEN 'foodanddrinks'
          WHEN e.job_title LIKE '%maintenance%' THEN 'maintenance'
          ELSE 'giftshop'
        END AS department
      FROM employee e
      WHERE e.email = ?`,
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Manager not found" });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching manager info:", err);
    res.status(500).json({ error: "DB error", message: err.message });
  }
});

// Get dashboard data
app.get("/manager/:department", async (req, res) => {
  try {
    const dept = req.params.department;
    
    if (!['giftshop','foodanddrinks','maintenance'].includes(dept)) {
      return res.status(400).json({ error: "Invalid department" });
    }

    const storeType = dept === 'giftshop' ? 'gift' : (dept === 'foodanddrinks' ? 'food' : null);

    // Get staff
    let staff = [];
    if (dept === 'maintenance') {
      const [rows] = await pool.query(`
        SELECT DISTINCT e.employee_id, e.first_name, e.last_name, e.job_title, e.email
        FROM employee e
        JOIN employee_maintenance_job emj ON e.employee_id = emj.employee_id
        JOIN maintenance m ON emj.maintenance_id = m.maintenance_id
      `);
      staff = rows;
    } else {
      const [rows] = await pool.query(`
        SELECT DISTINCT e.employee_id, e.first_name, e.last_name, e.job_title, e.email
        FROM employee e
        JOIN employee_store_job esj ON e.employee_id = esj.employee_id
        JOIN store s ON esj.store_id = s.store_id
        WHERE s.type = ?
      `, [storeType]);
      staff = rows;
    }

    // Get inventory
    let inventory = [];
    if (dept !== 'maintenance') {
      const [rows] = await pool.query(`
        SELECT s.name AS store_name, m.name AS item_name, m.price, m.quantity, m.type, m.item_id
        FROM store s
        JOIN store_inventory si ON s.store_id = si.store_id
        JOIN merchandise m ON si.item_id = m.item_id
        WHERE s.type = ?
      `, [storeType]);
      inventory = rows;
    }

    // Get sales
    let sales = { today: 0, week: 0, month: 0 };
    if (dept !== 'maintenance') {
      const [rows] = await pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN so.order_date = CURDATE() THEN sod.quantity * m.price ELSE 0 END),0) AS today,
          COALESCE(SUM(CASE WHEN YEARWEEK(so.order_date,1) = YEARWEEK(CURDATE(),1) THEN sod.quantity * m.price ELSE 0 END),0) AS week,
          COALESCE(SUM(CASE WHEN MONTH(so.order_date)=MONTH(CURDATE()) AND YEAR(so.order_date)=YEAR(CURDATE()) THEN sod.quantity * m.price ELSE 0 END),0) AS month
        FROM store_order_detail sod
        JOIN store_order so ON sod.store_order_id = so.store_order_id
        JOIN merchandise m ON sod.item_id = m.item_id
        JOIN store s ON so.store_id = s.store_id
        WHERE s.type = ?
      `, [storeType]);
      
      const r = rows[0] || { today:0, week:0, month:0 };
      sales = { 
        today: Number(r.today), 
        week: Number(r.week), 
        month: Number(r.month) 
      };
    }

    res.json({ staff, inventory, sales });
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).json({ error: "DB error", message: err.message });
  }
});

// Get staff details
app.get("/manager/:department/staff-details", async (req, res) => {
  try {
    const dept = req.params.department;
    
    if (dept === 'maintenance') {
      const [rows] = await pool.query(`
        SELECT 
          e.employee_id,
          e.first_name, 
          e.last_name, 
          e.job_title,
          COUNT(DISTINCT emj.maintenance_id) as active_jobs,
          GROUP_CONCAT(DISTINCT m.status) as job_statuses
        FROM employee e
        JOIN employee_maintenance_job emj ON e.employee_id = emj.employee_id
        JOIN maintenance m ON emj.maintenance_id = m.maintenance_id
        GROUP BY e.employee_id, e.first_name, e.last_name, e.job_title
      `);
      res.json(rows);
    } else {
      const storeType = dept === 'giftshop' ? 'gift' : 'food';
      const [rows] = await pool.query(`
        SELECT 
          e.employee_id,
          e.first_name, 
          e.last_name, 
          e.job_title,
          COUNT(DISTINCT esj.store_id) as stores_assigned,
          GROUP_CONCAT(DISTINCT s.name) as store_names
        FROM employee e
        JOIN employee_store_job esj ON e.employee_id = esj.employee_id
        JOIN store s ON esj.store_id = s.store_id
        WHERE s.type = ?
        GROUP BY e.employee_id, e.first_name, e.last_name, e.job_title
      `, [storeType]);
      res.json(rows);
    }
  } catch (err) {
    console.error("Error fetching staff details:", err);
    res.status(500).json({ error: "DB error", message: err.message });
  }
});

// Get recent transactions
app.get("/manager/:department/recent-transactions", async (req, res) => {
  try {
    const dept = req.params.department;
    
    if (dept === 'maintenance') {
      const [rows] = await pool.query(`
        SELECT 
          m.maintenance_id,
          m.description,
          m.start_date,
          m.end_date,
          m.status,
          r.name as ride_name
        FROM maintenance m
        LEFT JOIN ride r ON m.ride_id = r.ride_id
        ORDER BY m.start_date DESC
        LIMIT 20
      `);
      res.json(rows);
    } else {
      const storeType = dept === 'giftshop' ? 'gift' : 'food';
      const [rows] = await pool.query(`
        SELECT 
          so.store_order_id,
          so.order_date,
          s.name as store_name,
          SUM(sod.quantity * m.price) as total_amount,
          COUNT(sod.item_id) as item_count
        FROM store_order so
        JOIN store s ON so.store_id = s.store_id
        JOIN store_order_detail sod ON so.store_order_id = sod.store_order_id
        JOIN merchandise m ON sod.item_id = m.item_id
        WHERE s.type = ?
        GROUP BY so.store_order_id, so.order_date, s.name
        ORDER BY so.order_date DESC
        LIMIT 20
      `, [storeType]);
      res.json(rows);
    }
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: "DB error", message: err.message });
  }
});

// Get low stock items
app.get("/manager/:department/low-stock", async (req, res) => {
  try {
    const dept = req.params.department;
    
    if (dept === 'maintenance') {
      return res.json([]);
    }
    
    const storeType = dept === 'giftshop' ? 'gift' : 'food';
    const [rows] = await pool.query(`
      SELECT 
        m.name,
        m.quantity,
        m.price,
        m.type,
        s.name as store_name
      FROM merchandise m
      JOIN store_inventory si ON m.item_id = si.item_id
      JOIN store s ON si.store_id = s.store_id
      WHERE s.type = ? AND m.quantity < 20
      ORDER BY m.quantity ASC
    `, [storeType]);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching low stock:", err);
    res.status(500).json({ error: "DB error", message: err.message });
  }
});

// Get top selling items
app.get("/manager/:department/top-items", async (req, res) => {
  try {
    const dept = req.params.department;
    
    if (dept === 'maintenance') {
      return res.json([]);
    }
    
    const storeType = dept === 'giftshop' ? 'gift' : 'food';
    const [rows] = await pool.query(`
      SELECT 
        m.name,
        SUM(sod.quantity) as total_sold,
        SUM(sod.quantity * m.price) as revenue
      FROM store_order_detail sod
      JOIN merchandise m ON sod.item_id = m.item_id
      JOIN store_order so ON sod.store_order_id = so.store_order_id
      JOIN store s ON so.store_id = s.store_id
      WHERE s.type = ?
      GROUP BY m.item_id, m.name
      ORDER BY total_sold DESC
      LIMIT 5
    `, [storeType]);
    
    res.json(rows);
  } catch (err) {
    console.error("Error fetching top items:", err);
    res.status(500).json({ error: "DB error", message: err.message });
  }
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));