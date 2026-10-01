const { connect } = require("@tidbcloud/serverless");
const mysql = require("mysql2/promise");

// Connect to TiDB Cloud using @tidbcloud/serverless or MySQL2
const getTiDB = () => {
  const databaseUrl = process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL;
  if (!databaseUrl) {
    console.warn("⚠️ TiDB: No DATABASE_URL or TIDB_DATABASE_URL found in environment variables.");
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
        imageUrl TEXT,
        wasteType VARCHAR(100),
        description TEXT,
        lat DOUBLE,
        lng DOUBLE,
        locationName VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        reported_by_id INT,
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

module.exports = {
  getTiDB,
  initTiDB,
};
