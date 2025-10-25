const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ServiceSchema = new Schema(
  {
    frequency: {
      type: String,
      required: [true, "Please select frequency"],
    },
    service: {
      type: [String],
      required: [true, "Please provide service name"],
    },
    serviceDue: [String],
    image: { type: String },
    card: { type: String },
    qr: { type: String },
    chemicals: [String],
    area: { type: String },
    business: { type: String },
    serviceReport: {
      type: Boolean,
      default: false,
    },
    treatmentLocation: {
      type: String,
      required: [true, "Please provide treatment location"],
    },
    contract: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    serviceCardNumber: {
      type: Number,
      min: 1,
      index: true,
    },
    // --- NEW QUERYABLE FIELD ADDED ---
    billingMonths: {
      type: [String],
      index: true, // Index for super-fast lookups!
    },
    // --- END NEW QUERYABLE FIELD ---
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ServiceSchema.virtual("serviceReports", {
  ref: "ServiceReport",
  localField: "_id",
  foreignField: "service",
  justOne: false,
});

// Pre-save hook to assign serviceCardNumber for new services
ServiceSchema.pre("save", async function (next) {
  if (
    this.isNew &&
    (this.serviceCardNumber === null || this.serviceCardNumber === undefined)
  ) {
    try {
      const highestService = await this.constructor
        .findOne({ contract: this.contract })
        .sort({ serviceCardNumber: -1 });
      this.serviceCardNumber =
        highestService && highestService.serviceCardNumber
          ? highestService.serviceCardNumber + 1
          : 1;
    } catch (error) {
      console.error("Error assigning serviceCardNumber:", error);
      return next(error);
    }
  }
  next();
});

// --- NEW HOOK FOR RE-NUMBERING AFTER DELETION ADDED ---
ServiceSchema.post("remove", async function (doc, next) {
  try {
    const remainingServices = await this.constructor
      .find({ contract: doc.contract })
      .sort({ serviceCardNumber: "asc" });

    const updates = remainingServices.map((service, index) => ({
      updateOne: {
        filter: { _id: service._id },
        update: { $set: { serviceCardNumber: index + 1 } },
      },
    }));

    if (updates.length > 0) {
      await this.constructor.bulkWrite(updates);
    }
    next();
  } catch (error) {
    console.error("Error re-numbering services after deletion:", error);
    next(error);
  }
});
// --- END NEW HOOK ---

module.exports = mongoose.model("Service", ServiceSchema);