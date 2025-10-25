const express = require("express");
const router = express.Router();
const multer = require("multer");
const { sendBillEmail } = require("../controllers/mailController");
const { getDueBillingCards, getAfterJobCards } = require("../controllers/billingController");
const ServiceReport = require("../models/ServiceReport");
const { logBillingActivity } = require("../utils/logBillingActivity");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/bills/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Routes
router.get("/due-cards", getDueBillingCards);
router.get("/after-job", getAfterJobCards);

router.post("/upload-bill", upload.array("billFiles", 10), async (req, res) => {
  try {
    const { contractNo } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: "No bill files were uploaded." });
    if (!contractNo) return res.status(400).json({ success: false, message: "Contract number is missing." });

    const billPaths = req.files.map(f => f.path.replace(/\\/g, "/"));
    const serviceCards = await ServiceReport.find({ contractNo });
    const cardPaths = serviceCards.reduce((acc, card) => {
      if (card.cardFrontImage) acc.push(card.cardFrontImage.replace(/\\/g, "/"));
      if (card.cardBackImage) acc.push(card.cardBackImage.replace(/\\/g, "/"));
      return acc;
    }, []);

    res.status(200).json({ success: true, message: "Files uploaded successfully", billPaths, cardPaths, contractNo });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Server error during file upload." });
  }
});

// Download card logging
router.post("/download-card", async (req, res) => {
  try {
    const { contractNo, cardSide, cardPath } = req.body;
    if (!req.user) return res.status(401).json({ msg: "Unauthorized" });

    await logBillingActivity({ userId: req.user._id, actionType: "downloadCard", additionalInfo: `Downloaded ${cardSide} card for contract ${contractNo}, path: ${cardPath}` });
    res.status(200).json({ success: true, msg: "Card download logged" });
  } catch (err) {
    console.error("Error logging card download:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// Send bill email and log
router.post("/send-bill-email", async (req, res, next) => {
  try {
    await sendBillEmail(req, res);
    if (req.user) await logBillingActivity({ userId: req.user._id, actionType: "sendEmail", additionalInfo: `Sent billing email for contract ${req.body.contractNo} to ${req.body.emailTo}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
