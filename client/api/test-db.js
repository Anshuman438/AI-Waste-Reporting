const { connect } = require("@tidbcloud/serverless");

const getDbUrl = (req) => {
  return (
    req?.headers?.["x-db-url"] ||
    req?.query?.url ||
    req?.body?.url ||
    process.env.DATABASE_URL ||
    process.env.TIDB_DATABASE_URL ||
    'mysql://3J8trmw64KZr7yY.root:SB3ubp1rPKMNSU3T@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}'
  );
};

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-db-url");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = getDbUrl(req);
  try {
    const conn = connect({ url });
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

    const tables = await conn.execute(`SHOW TABLES`);
    const cRows = await conn.execute(`SELECT COUNT(*) as count FROM complaints`);
    let userCount = 0;
    try {
      const uRows = await conn.execute(`SELECT COUNT(*) as count FROM users`);
      userCount = uRows[0]?.count || 0;
    } catch (e) {}

    return res.status(200).json({
      connected: true,
      message: "TiDB Cloud Serverless database is active and connected!",
      tables,
      stats: {
        users: userCount,
        complaints: cRows[0]?.count || 0
      }
    });
  } catch (err) {
    return res.status(200).json({
      connected: false,
      message: "TiDB Serverless Connection Note: " + err.message
    });
  }
};
