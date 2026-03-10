const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

console.log("-----------------------------------------");
console.log("🚀 CRM Backend Initialization Starting...");
console.log("-----------------------------------------");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const leadRoutes = require("./routes/leads");
const propertyRoutes = require("./routes/properties");
const propertyMatchingRoutes = require("./routes/propertyMatchingRoutes");
const dealRoutes = require("./routes/deals");
const activityRoutes = require("./routes/activities");
const dashboardRoutes = require("./routes/dashboard");
const communicationRoutes = require("./routes/communicationRoutes");
const taskRoutes = require("./routes/tasks");
const visitRoutes = require("./routes/visits");

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Increased for development polling
});
app.use(limiter);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/properties", propertyMatchingRoutes); // Mount before standard properties to avoid /:id collision
app.use("/api/properties", propertyRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/visits", visitRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI is not defined in .env file");
  process.exit(1);
}

console.log("📡 Attempting to connect to MongoDB...");

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // 10s timeout
  })
  .then(() => {
    console.log("✅ SUCCESS: Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`📡 SERVER: Operating on http://localhost:${PORT}`);
      console.log("-----------------------------------------");
    });
  })
  .catch((error) => {
    console.error("❌ DATABASE CONNECTION ERROR:");
    console.error(error.message);
    console.log("\n💡 Troubleshooting Tips:");
    console.log("1. Check if your IP address is whitelisted in MongoDB Atlas.");
    console.log("2. Verify that your MONGODB_URI in .env is correct.");
    console.log("3. Ensure you have a stable internet connection.");
    console.log("-----------------------------------------");
    process.exit(1);
  });
