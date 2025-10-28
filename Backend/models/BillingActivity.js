const mongoose = require("mongoose");

const billingActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BillingUser",
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    actionType: {
        type: String,
        enum: [
            "login",
            "logout",
            "download_front",
            "download_back",
            "upload_bill",
            "send_email"
        ],
        required: true
    },
    contractNo: {
        type: String,
        default: null
    },
    cardNo: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("BillingActivity", billingActivitySchema);
