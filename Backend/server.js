const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const activityRoutes = require("./routes/activityRoutes");
const billingRoutes = require("./routes/billingRoutes");

dotenv.config();

// --- DATABASE CONNECTION ---
// Removed deprecated options: useNewUrlParser and useUnifiedTopology
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();

// --- CORS CONFIGURATION ---
// Simplified the origin configuration to use a direct array
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local frontend (vite)
      "https://your-frontend-domain.onrender.com", // future deployed frontend
      // Note: You don't need to include your backend URL (billingcqr.onrender.com) here.
    ],
    credentials: true,
  })
);

// --- MIDDLEWARE ---
app.use(express.json());

// --- TEST ROOT ROUTE ---
app.get("/", (req, res) => {
  res.send("Billing-CQR API is running ✅");
});

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/billing", billingRoutes);
app.use("/uploads", express.static("uploads"));

// --- SERVER LISTENER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
