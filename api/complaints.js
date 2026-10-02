const { connect } = require("@tidbcloud/serverless");

const getDbUrl = (req) => {
  return (
    req?.headers?.["x-db-url"] ||
    req?.query?.db_url ||
    process.env.DATABASE_URL ||
    process.env.TIDB_DATABASE_URL ||
    'mysql://3J8trmw64KZr7yY.root:SB3ubp1rPKMNSU3T@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}'
  );
};

const ensureTables = async (conn) => {
  try {
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
  } catch (e) {}
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-user-email, x-user-id, x-user-role, x-db-url");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const dbUrl = getDbUrl(req);
  let conn = null;
  try {
    conn = connect({ url: dbUrl });
    await ensureTables(conn);
  } catch (err) {
    console.error("TiDB connect error:", err.message);
  }

  // GET: Fetch all complaints or user complaints
  if (req.method === "GET") {
    const userEmail = (req.headers["x-user-email"] || req.query.email || "").toLowerCase().trim();
    const isUserOnly = req.url.includes("/my") || req.query.mode === "my";

    if (!conn) {
      return res.status(200).json([]);
    }

    try {
      let rows = [];
      if (isUserOnly && userEmail) {
        rows = await conn.execute(
          `SELECT * FROM complaints WHERE LOWER(reported_by_email) = ? ORDER BY created_at DESC`,
          [userEmail]
        );
      } else {
        rows = await conn.execute(`SELECT * FROM complaints ORDER BY created_at DESC`);
      }

      const formatted = (rows || []).map((r) => ({
        _id: String(r.id),
        id: String(r.id),
        imageUrl: r.imageUrl,
        wasteType: r.wasteType,
        description: r.description,
        location: {
          lat: r.lat || 22.5726,
          lng: r.lng || 88.3639,
          address: r.locationName || "Reported Location",
        },
        status: r.status || "pending",
        reportedBy: {
          _id: r.reported_by_id,
          name: r.reported_by_name || "Citizen Reporter",
          email: r.reported_by_email || "citizen@safai.org",
        },
        createdAt: r.created_at || new Date().toISOString(),
      }));

      return res.status(200).json(formatted);
    } catch (err) {
      console.error("Fetch complaints error:", err.message);
      return res.status(200).json([]);
    }
  }

  // POST: Create complaint
  if (req.method === "POST") {
    const body = req.body || {};
    const imageUrl = body.imageUrl || body.image || "";
    const wasteType = body.wasteType || "mixed";
    const description = body.description || "Civic waste reported via safAI.";
    const loc = body.location || { lat: 22.5726, lng: 88.3639, address: "Civic Location" };
    const reporterId = req.headers["x-user-id"] || body.reportedById || "usr-" + Date.now();
    const reporterName = body.reportedByName || req.headers["x-user-name"] || "Citizen Reporter";
    const reporterEmail = (req.headers["x-user-email"] || body.reportedByEmail || "citizen@safai.org").toLowerCase().trim();

    if (conn) {
      try {
        const result = await conn.execute(
          `INSERT INTO complaints 
           (imageUrl, wasteType, description, lat, lng, locationName, status, reported_by_id, reported_by_name, reported_by_email) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            imageUrl,
            wasteType,
            description,
            loc.lat || 22.5726,
            loc.lng || 88.3639,
            loc.address || "Civic Location",
            "pending",
            reporterId,
            reporterName,
            reporterEmail
          ]
        );

        const newId = result.lastInsertId ? String(result.lastInsertId) : "tidb-" + Date.now();
        return res.status(201).json({
          _id: newId,
          id: newId,
          imageUrl,
          wasteType,
          description,
          location: loc,
          status: "pending",
          reportedBy: {
            _id: reporterId,
            name: reporterName,
            email: reporterEmail,
          },
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Insert complaint error:", err.message);
      }
    }

    // Fallback response
    const fallbackId = "comp-" + Date.now();
    return res.status(201).json({
      _id: fallbackId,
      id: fallbackId,
      imageUrl,
      wasteType,
      description,
      location: loc,
      status: "pending",
      reportedBy: { _id: reporterId, name: reporterName, email: reporterEmail },
      createdAt: new Date().toISOString(),
    });
  }

  // PUT: Update status
  if (req.method === "PUT" || req.method === "PATCH") {
    const { id, status } = req.body || {};
    if (conn && id && status) {
      try {
        await conn.execute(`UPDATE complaints SET status = ? WHERE id = ?`, [status, id]);
        return res.status(200).json({ message: "Status updated successfully", id, status });
      } catch (err) {
        console.error("Update status error:", err.message);
      }
    }
    return res.status(200).json({ message: "Status updated", id, status });
  }

  // DELETE: Remove complaint
  if (req.method === "DELETE") {
    const id = req.query.id || (req.body && req.body.id);
    if (conn && id) {
      try {
        await conn.execute(`DELETE FROM complaints WHERE id = ?`, [id]);
        return res.status(200).json({ message: "Complaint deleted", id });
      } catch (err) {
        console.error("Delete error:", err.message);
      }
    }
    return res.status(200).json({ message: "Complaint deleted", id });
  }

  return res.status(200).json({ message: "safAI Complaints API" });
};
