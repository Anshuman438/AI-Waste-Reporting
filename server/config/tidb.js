const { connect } = require("@tidbcloud/serverless");

// Connect to TiDB Cloud using @tidbcloud/serverless
const getTiDB = () => {
  const databaseUrl = process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL;
  if (!databaseUrl) {
    return null;
  }
  try {
    return connect({ url: databaseUrl });
  } catch (err) {
    console.error("TiDB Connection Error:", err.message);
    return null;
  }
};

// Initialize TiDB Tables
const initTiDB = async () => {
  const conn = getTiDB();
  if (!conn) return;

  try {
    console.log("⚡ Checking and initializing TiDB Cloud tables...");

    // Create users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create complaints table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS complaints (
        id INT AUTO_INCREMENT PRIMARY KEY,
        imageUrl LONGTEXT,
        wasteType VARCHAR(100),
        description TEXT,
        lat DOUBLE,
        lng DOUBLE,
        locationName VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        reported_by_id VARCHAR(255),
        reported_by_name VARCHAR(255),
        reported_by_email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("🌿 TiDB Cloud schema initialized successfully (users & complaints tables ready).");
  } catch (err) {
    console.warn("TiDB Initialization Note:", err.message);
  }
};

// User Queries for TiDB
const tidbFindUserByEmail = async (email) => {
  const conn = getTiDB();
  if (!conn) return null;
  try {
    const rows = await conn.execute(`SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`, [email.trim()]);
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("TiDB findUserByEmail error:", err.message);
    return null;
  }
};

const tidbFindUserById = async (id) => {
  const conn = getTiDB();
  if (!conn) return null;
  try {
    const rows = await conn.execute(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    console.error("TiDB findUserById error:", err.message);
    return null;
  }
};

const tidbCreateUser = async ({ name, email, password, role = "user", avatar = null }) => {
  const conn = getTiDB();
  if (!conn) return null;
  try {
    const result = await conn.execute(
      `INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)`,
      [name, email.toLowerCase().trim(), password, role, avatar]
    );
    return { id: result.lastInsertId || Date.now(), name, email, role, avatar };
  } catch (err) {
    console.error("TiDB createUser error:", err.message);
    return null;
  }
};

const tidbUpdateUserPassword = async (email, hashedPassword) => {
  const conn = getTiDB();
  if (!conn) return false;
  try {
    await conn.execute(
      `UPDATE users SET password = ? WHERE LOWER(email) = LOWER(?)`,
      [hashedPassword, email.toLowerCase().trim()]
    );
    return true;
  } catch (err) {
    console.error("TiDB updateUserPassword error:", err.message);
    return false;
  }
};

const tidbGetAllUsers = async () => {
  const conn = getTiDB();
  if (!conn) return [];
  try {
    const rows = await conn.execute(`SELECT id, name, email, role, avatar, created_at FROM users ORDER BY created_at DESC`);
    return rows && Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error("TiDB getAllUsers error:", err.message);
    return [];
  }
};

// Complaint Queries for TiDB
const tidbInsertComplaint = async ({
  imageUrl,
  wasteType,
  description,
  lat,
  lng,
  locationName,
  status = "pending",
  reported_by_id,
  reported_by_name,
  reported_by_email
}) => {
  const conn = getTiDB();
  if (!conn) return null;
  try {
    const result = await conn.execute(
      `INSERT INTO complaints 
       (imageUrl, wasteType, description, lat, lng, locationName, status, reported_by_id, reported_by_name, reported_by_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        imageUrl || "",
        wasteType || "mixed",
        description || "Civic waste report",
        lat || 22.5726,
        lng || 88.3639,
        locationName || "Reported Location",
        status || "pending",
        String(reported_by_id || ""),
        reported_by_name || "Citizen Reporter",
        reported_by_email || "citizen@safai.org"
      ]
    );

    return {
      _id: result.lastInsertId ? String(result.lastInsertId) : "tidb-" + Date.now(),
      id: result.lastInsertId ? String(result.lastInsertId) : "tidb-" + Date.now(),
      imageUrl,
      wasteType,
      description,
      location: { lat: lat || 22.5726, lng: lng || 88.3639, address: locationName || "Reported Location" },
      status: status || "pending",
      reportedBy: {
        _id: reported_by_id,
        name: reported_by_name || "Citizen Reporter",
        email: reported_by_email || "citizen@safai.org"
      },
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    console.error("TiDB Insert Complaint Error:", err.message);
    return null;
  }
};

const tidbGetAllComplaints = async () => {
  const conn = getTiDB();
  if (!conn) return [];
  try {
    const rows = await conn.execute(`SELECT * FROM complaints ORDER BY created_at DESC`);
    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((r) => ({
      _id: String(r.id),
      id: String(r.id),
      imageUrl: r.imageUrl,
      wasteType: r.wasteType,
      description: r.description,
      location: {
        lat: r.lat || 22.5726,
        lng: r.lng || 88.3639,
        address: r.locationName || "Reported Location"
      },
      status: r.status || "pending",
      reportedBy: {
        _id: r.reported_by_id,
        name: r.reported_by_name || "Citizen Reporter",
        email: r.reported_by_email || "citizen@safai.org"
      },
      createdAt: r.created_at || new Date().toISOString()
    }));
  } catch (err) {
    console.error("TiDB GetAllComplaints Error:", err.message);
    return [];
  }
};

const tidbGetUserComplaints = async (userEmailOrId) => {
  const conn = getTiDB();
  if (!conn) return [];
  try {
    const rows = await conn.execute(
      `SELECT * FROM complaints WHERE reported_by_email = ? OR reported_by_id = ? ORDER BY created_at DESC`,
      [String(userEmailOrId), String(userEmailOrId)]
    );
    if (!rows || !Array.isArray(rows)) return [];

    return rows.map((r) => ({
      _id: String(r.id),
      id: String(r.id),
      imageUrl: r.imageUrl,
      wasteType: r.wasteType,
      description: r.description,
      location: {
        lat: r.lat || 22.5726,
        lng: r.lng || 88.3639,
        address: r.locationName || "Reported Location"
      },
      status: r.status || "pending",
      reportedBy: {
        _id: r.reported_by_id,
        name: r.reported_by_name,
        email: r.reported_by_email
      },
      createdAt: r.created_at || new Date().toISOString()
    }));
  } catch (err) {
    console.error("TiDB GetUserComplaints Error:", err.message);
    return [];
  }
};

const tidbUpdateComplaintStatus = async (id, status) => {
  const conn = getTiDB();
  if (!conn) return false;
  try {
    await conn.execute(`UPDATE complaints SET status = ? WHERE id = ?`, [status, id]);
    return true;
  } catch (err) {
    console.error("TiDB UpdateComplaintStatus Error:", err.message);
    return false;
  }
};

const tidbDeleteComplaint = async (id) => {
  const conn = getTiDB();
  if (!conn) return false;
  try {
    await conn.execute(`DELETE FROM complaints WHERE id = ?`, [id]);
    return true;
  } catch (err) {
    console.error("TiDB DeleteComplaint Error:", err.message);
    return false;
  }
};

module.exports = {
  getTiDB,
  initTiDB,
  tidbFindUserByEmail,
  tidbFindUserById,
  tidbCreateUser,
  tidbUpdateUserPassword,
  tidbGetAllUsers,
  tidbInsertComplaint,
  tidbGetAllComplaints,
  tidbGetUserComplaints,
  tidbUpdateComplaintStatus,
  tidbDeleteComplaint
};
