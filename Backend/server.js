const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require('./routes/authRoutes');
const activityRoutes = require("./routes/activityRoutes");


dotenv.config();

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
});

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- ROOT ROUTE (for health check) ---
app.get("/", (req, res) => {
    res.send("Billing-CQR API is running ✅");
});

// --- API ROUTES ---
// MODIFIED: Removed the old '/api/cards' route.
// ADDED: Registered the new billing routes under the '/api/billing' path.
// This tells Express to use the routes defined in 'billingRoutes.js' for any
// request that starts with /api/billing (e.g., /api/billing/due-cards).

app.get("/api/billing/ping-test", (req, res) => {
  console.log("✅ [Server] /ping-test route was hit!");
  res.send("Pong from server.js!");
});

app.use("/api/billing", require("./routes/billingRoutes"));
console.log("✅ [Server] Billing routes registered to /api/billing"); // <-- ADD THIS LINE

app.use('/api/auth',authRoutes);
app.use("/api/activity", activityRoutes);

// This is the corrected code
app.use("/uploads", cors(), express.static("uploads"));
// --- SERVER LISTENER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));