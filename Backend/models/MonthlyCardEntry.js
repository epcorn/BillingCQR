const mongoose = require("mongoose");

const MonthlyCardEntrySchema = new mongoose.Schema({
  serviceReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceReport",
    required: true,
    unique: true, 
  },
  marked: {
    type: Boolean,
    default: false,
  },
  billImage: {
    type: String,
    default: "",
  },
  month: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model("MonthlyCardEntry", MonthlyCardEntrySchema);
