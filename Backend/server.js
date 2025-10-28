const express = require("express");
const dotenv = require("dotenv");
// We are no longer using the cors package, so you could even remove this line
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

// --- CUSTOM ALL-IN-ONE CORS HANDLER ---
// This MUST be the first middleware.
app.use((req, res, next) => {
  // Set the allowed origin. Be very specific.
  // This header is set for ALL requests.
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Add any custom headers you use
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Check if it's a preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    console.log("Custom CORS handler: Intercepted OPTIONS request for:", req.path);
    // End the request here with a 204 success code
    return res.status(204).send();
  }

  // Not an OPTIONS request, move to the next middleware (express.json, routes, etc.)
  console.log("Custom CORS handler: Passed through request for:", req.path);
  next();
});

// We no longer need the separate app.use(cors(...))
// (The middleware above handles everything)

// --- MIDDLEWARE ---
// This MUST come AFTER our custom CORS handler
app.use(express.json());

// --- TEST ROOT ROUTE ---
app.get("/", (req, res) => {
  res.send("Billing-CQR API is running ✅");
});

// --- ROUTES ---
// These MUST come AFTER our custom CORS handler and express.json
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/billing", billingRoutes);
app.use("/uploads", express.static("uploads"));

// --- SERVER LISTENER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

