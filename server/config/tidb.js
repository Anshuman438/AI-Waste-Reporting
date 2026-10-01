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

// Initialize TiDB Tables and auto-seed admin if missing
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
        imageUrl TEXT,
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

module.exports = {
  getTiDB,
  initTiDB,
  tidbFindUserByEmail,
  tidbFindUserById,
  tidbCreateUser,
  tidbUpdateUserPassword,
};
