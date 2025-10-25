const BillingActivity = require('../models/BillingActivity'); // Adjust path

/**
 * Log a billing activity
 * @param {Object} param0
 * @param {String} param0.userId - MongoDB ObjectId of the user
 * @param {String} param0.actionType - Type of action (login, logout, sendEmail, downloadCard, etc.)
 * @param {String} param0.additionalInfo - Optional extra info
 */
const logBillingActivity = async ({ userId, actionType, additionalInfo }) => {
    try {
        const log = new BillingActivity({
            user: userId,
            actionType,
            additionalInfo
        });
        await log.save();
    } catch (err) {
        console.error("Error logging billing activity:", err);
    }
};

module.exports = { logBillingActivity };
