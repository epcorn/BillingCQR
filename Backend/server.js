const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes");
const billingRoutes = require("./routes/billingRoutes");

dotenv.config();

// --- DATABASE CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();

// --- CORS CONFIGURATION (MANUAL PREFLIGHT) ---

// 1. Manually handle ALL OPTIONS requests
// This will intercept the 'OPTIONS /api/auth/login' request
// before it can "fall through" and become a 404.
// This MUST be the first middleware.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log("Manual OPTIONS handler triggered for:", req.path);
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Add any custom headers you use
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Send 204 (No Content) which is the standard for preflight
    return res.status(204).send();
  }
  // Not an OPTIONS request, move to the next middleware
  next();
});

// 2. Use the 'cors' middleware for all NON-OPTIONS requests
// This will add the 'Access-Control-Allow-Origin' header to your
// actual POST /login request.
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);

// --- MIDDLEWARE ---
// This MUST come AFTER the cors middleware
app.use(express.json());

// --- TEST ROOT ROUTE ---
app.get("/", (req, res) => {
  res.send("Billing-CQR API is running ✅");
});

// --- ROUTES ---
// These MUST come AFTER the cors and express.json middleware
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/billing", billingRoutes);
app.use("/uploads", express.static("uploads"));

// --- SERVER LISTENER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

