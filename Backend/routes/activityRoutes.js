const express = require("express");
const router = express.Router();
const BillingActivity = require("../models/BillingActivity");
const protect = require("../middleware/auth");

// Middleware to check admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ msg: "Access denied. Admins only." });
  }
};

// 🟢 Create new activity (for download, upload, email, etc.)
router.post("/", protect, async (req, res) => {
  try {
    const user = req.user; // comes from auth middleware
    if (!user) return res.status(401).json({ msg: "Unauthorized" });

    const { actionType, contractNo, cardNo } = req.body;

    if (!actionType) {
      return res.status(400).json({ msg: "actionType is required" });
    }

    await BillingActivity.create({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      actionType,
      contractNo: contractNo || null,
      cardNo: cardNo || null,
    });

    res.json({ success: true, msg: "Activity logged successfully" });
  } catch (err) {
    console.error("Error logging billing activity:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// 🟣 Get all activities (admin only)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const activities = await BillingActivity.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
