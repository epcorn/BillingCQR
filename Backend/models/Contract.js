const mongoose = require("mongoose");

// Define sub-schemas for consistency and to avoid needing _id's
const SingleBillingConfigSchema = new mongoose.Schema(
  {
    frequencyType: String,
    manualDescription: String,
    calculatedBillingMonths: [String],
    selectedManualMonths: [String],
  },
  { _id: false }
);

const MultiBillingConfigSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
    serviceName: [String], // Good to store for reference
    frequencyType: String,
    manualDescription: String,
    calculatedBillingMonths: [String],
    selectedManualMonths: [String],
  },
  { _id: false }
);

const ContractSchema = new mongoose.Schema(
  {
    contractNo: { type: String, required: true },
    type: { type: String },
    sales: { type: String },
    company: { type: String },
    billToAddress: {
      prefix: String,
      name: String,
      address1: String,
      address2: String,
      address3: String,
      address4: String,
      nearBy: String,
      city: String,
      pincode: Number,
    },
    billToContact1: { name: String, contact: String, email: String },
    billToContact2: { name: String, contact: String, email: String },
    billToContact3: { name: String, contact: String, email: String },
    shipToAddress: {
      prefix: String,
      name: String,
      address1: String,
      address2: String,
      address3: String,
      address4: String,
      nearBy: String,
      city: String,
      pincode: Number,
    },
    shipToContact1: { name: String, contact: String, email: String },
    shipToContact2: { name: String, contact: String, email: String },
    shipToContact3: { name: String, contact: String, email: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    // billingFrequency: { type: String, required: true }, // <-- This is now replaced by the system below
    specialInstruction: [String],
    preferred: { day: String, time: String },
    sendMail: { type: Boolean, default: false },
    document: [Object],
    branch: { type: String },
    contractCode: { type: String },

    // --- NEW BILLING FIELDS ADDED ---
    billingType: {
      type: String,
      enum: ["single", "multi"],
      default: "single",
    },
    singleBillingConfig: SingleBillingConfigSchema,
    multiBillingConfig: [MultiBillingConfigSchema],
    // --- END NEW BILLING FIELDS ---

    createdAt: { type: Date, default: Date.now },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

ContractSchema.virtual("services", {
  ref: "Service",
  localField: "_id",
  foreignField: "contract",
  justOne: false,
});

module.exports = mongoose.model("Contract", ContractSchema);