const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes");
const billingRoutes = require("./routes/billingRoutes");

dotenv.config();

// --- DATABASE CONNECTION ---
// Removed deprecated options
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();

// --- CORS CONFIGURATION ---

// 1. Define your allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://your-frontend-domain.onrender.com", // Your future deployed frontend
];

// 2. Create the CORS options object
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Explicitly allow all methods
  preflightContinue: false, // This is important: tells CORS to handle OPTIONS
  optionsSuccessStatus: 204 // Send 204 for successful OPTIONS requests
};

// 3. THIS IS THE FIX:
// We ONLY use `app.use(cors(corsOptions));`
// This one line, when placed before the routes, will:
//  a) Handle all preflight (OPTIONS) requests correctly.
//  b) Add the 'Access-Control-Allow-Origin' header to all other requests.
app.use(cors(corsOptions));

// --- MIDDLEWARE ---
app.use(express.json());

// --- TEST ROOT ROUTE ---
app.get("/", (req, res) => {
  res.send("Billing-CQR API is running ✅");
});

// --- ROUTES ---
// Your routes will now be processed *after* CORS is fully configured.
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/billing", billingRoutes);
app.use("/uploads", express.static("uploads"));

// --- SERVER LISTENER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

