import mongoose from "mongoose";

const billingActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who did it
  actionType: { type: String, required: true }, // e.g., "download_card", "send_email"
  contractNo: { type: String }, // optional, the contract related to the action
  cardId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceReport" }, // optional, the card affected
  fileName: { type: String }, // optional, file name if relevant
  additionalInfo: { type: Object }, // optional, any extra details
  createdAt: { type: Date, default: Date.now }, // when the action happened
});

const BillingActivity = mongoose.model("BillingActivity", billingActivitySchema);

export default BillingActivity;
