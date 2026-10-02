const { connect } = require("@tidbcloud/serverless");

let dynamicDbUrl = null;

const setDynamicDbUrl = (url) => {
  if (url && typeof url === "string" && url.trim().startsWith("mysql://")) {
    dynamicDbUrl = url.trim();
  }
};

const DEFAULT_TIDB_URL =
  'mysql://3J8trmw64KZr7yY.root:SB3ubp1rPKMNSU3T@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';

// Connect to TiDB Cloud using @tidbcloud/serverless
const getTiDB = (overrideUrl) => {
  const databaseUrl = 
    overrideUrl || 
    dynamicDbUrl || 
    process.env.DATABASE_URL || 
    process.env.TIDB_DATABASE_URL ||
    DEFAULT_TIDB_URL;

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

let tablesReady = false;

// Ensure tables exist before executing queries
const ensureTables = async (conn) => {
  if (tablesReady || !conn) return;
  try {
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

    tablesReady = true;
    console.log("🌿 TiDB Cloud schema initialized & verified (users & complaints tables ready).");
  } catch (err) {
    console.warn("TiDB Table Check Note:", err.message);
  }
};

const initTiDB = async () => {
  const conn = getTiDB();
  if (conn) {
    await ensureTables(conn);
  }
};

// User Queries for TiDB
const tidbFindUserByEmail = async (email) => {
  const conn = getTiDB();
  if (!conn) return null;
  try {
    await ensureTables(conn);
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
    await ensureTables(conn);
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
    await ensureTables(conn);
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
    await ensureTables(conn);
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
    await ensureTables(conn);
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
    await ensureTables(conn);
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

    const insertedId = result?.lastInsertId ? String(result.lastInsertId) : "tidb-" + Date.now();

    return {
      _id: insertedId,
      id: insertedId,
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
    await ensureTables(conn);
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
    await ensureTables(conn);
    const cleanSearch = String(userEmailOrId).toLowerCase().trim();
    const rows = await conn.execute(
      `SELECT * FROM complaints WHERE LOWER(reported_by_email) = ? OR reported_by_id = ? ORDER BY created_at DESC`,
      [cleanSearch, String(userEmailOrId)]
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
    await ensureTables(conn);
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
    await ensureTables(conn);
    await conn.execute(`DELETE FROM complaints WHERE id = ?`, [id]);
    return true;
  } catch (err) {
    console.error("TiDB DeleteComplaint Error:", err.message);
    return false;
  }
};

const checkTiDBStatus = async (overrideUrl) => {
  const dbUrl = overrideUrl || dynamicDbUrl || process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL;
  if (!dbUrl) {
    return {
      connected: false,
      message: "DATABASE_URL is not set in environment variables.",
      hint: "Add DATABASE_URL in Vercel Settings -> Environment Variables or enter connection string in modal."
    };
  }

  const conn = getTiDB(dbUrl);
  if (!conn) {
    return {
      connected: false,
      message: "Failed to create TiDB connection instance from database URL."
    };
  }

  try {
    // 1. Ensure tables exist
    await ensureTables(conn);

    // 2. Fetch table list
    const tables = await conn.execute(`SHOW TABLES`);

    // 3. Fetch counts
    let userCount = 0;
    let complaintCount = 0;

    try {
      const uRows = await conn.execute(`SELECT COUNT(*) as count FROM users`);
      userCount = uRows[0]?.count || 0;
    } catch (e) {}

    try {
      const cRows = await conn.execute(`SELECT COUNT(*) as count FROM complaints`);
      complaintCount = cRows[0]?.count || 0;
    } catch (e) {}

    if (overrideUrl) {
      setDynamicDbUrl(overrideUrl);
    }

    return {
      connected: true,
      message: "TiDB Cloud Serverless database is active and connected!",
      tables: tables || [],
      stats: {
        users: userCount,
        complaints: complaintCount
      }
    };
  } catch (err) {
    return {
      connected: false,
      message: "TiDB Connection Error: " + err.message,
      hint: "Verify that your TiDB cluster is running and your connection string credentials are correct."
    };
  }
};

module.exports = {
  getTiDB,
  setDynamicDbUrl,
  initTiDB,
  checkTiDBStatus,
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
