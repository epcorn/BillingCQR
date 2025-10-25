// models/CardHistory.js
const mongoose = require("mongoose");

const CardHistorySchema = new mongoose.Schema({
  entry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MonthlyCardEntry",
    required: true,
  },
  action: {
    type: String,
    enum: ["mark", "unmark", "upload", "remove_upload"],
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed, 
  },
  user: {
    type: String, 
  },
  at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("CardHistory", CardHistorySchema);
