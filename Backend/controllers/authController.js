const BillingUser = require('../models/BillingUser');
const BillingActivity = require('../models/BillingActivity');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Helper function to log activity
const logBillingActivity = async (user, actionType) => {
    try {
        await BillingActivity.create({
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            actionType
        });
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
};

// Login Controller
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await BillingUser.findOne({ email });
        if (!user) return res.status(401).json({ msg: "Invalid email or password" });

        const isMatch = await user.matchPassword(password);
        if (!isMatch) return res.status(401).json({ msg: "Invalid email or password" });

        // --- Log login activity ---
        await logBillingActivity(user, "login");

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};

// Logout Controller
exports.logout = async (req, res) => {
    try {
        const user = req.user; // Set by auth middleware
        if (!user) return res.status(400).json({ msg: "User not identified" });

        // --- Log logout activity ---
        await logBillingActivity(user, "logout");

        res.json({ success: true, msg: "Logout logged successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
