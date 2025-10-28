const BillingActivity = require("../models/BillingActivity");

// @desc  Log a billing activity (download, upload, email send, etc.)
exports.logBillingActivity = async (req, res) => {
  try {
    const { actionType, contractNo, cardNo } = req.body;

    if (!actionType) {
      return res.status(400).json({ msg: "Action type is required" });
    }

    const user = req.user; // populated by auth middleware
    if (!user) {
      return res.status(401).json({ msg: "User not authenticated" });
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
};
