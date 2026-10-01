const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { initTiDB } = require("./config/tidb");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

dotenv.config();

// Initialize Database Connections
connectDB();
initTiDB();

const app = express();

// Universal CORS handler supporting localhost, vercel domains & custom domains
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Root & API Health checks
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "safAI API running successfully" });
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "safAI API running successfully" });
});

// Live Database Diagnostic & Auto-Provisioning endpoint
const { checkTiDBStatus } = require("./config/tidb");
app.get("/api/test-db", async (req, res) => {
  const result = await checkTiDBStatus();
  return res.status(result.connected ? 200 : 500).json(result);
});
app.get("/test-db", async (req, res) => {
  const result = await checkTiDBStatus();
  return res.status(result.connected ? 200 : 500).json(result);
});

// Dual mounting to handle both standard and serverless rewrites
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/complaints", complaintRoutes);
app.use("/complaints", complaintRoutes);

app.get("/", (req, res) => {
  res.send("safAI API is running...");
});

// Start local server if not running as a Vercel serverless function
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
