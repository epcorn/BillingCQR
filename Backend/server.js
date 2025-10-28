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
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

const app = express();

// --- CORS CONFIGURATION ---
const allowedOrigins = [
  "http://localhost:5173", // local frontend (vite)
  "https://billing-cqr.onrender.com", // backend on render
  "https://your-frontend-domain.onrender.com", // future deployed frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
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
