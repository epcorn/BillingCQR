const BillingUser = require('../models/BillingUser');
const jwt = require('jsonwebtoken');
const { logBillingActivity } = require('../utils/logBillingActivity'); // Adjust path

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
        await logBillingActivity({
            userId: user._id,
            actionType: "login",
            additionalInfo: `User logged in at ${new Date().toISOString()}`
        });

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
        const userId = req.user?.id; // Set by auth middleware
        if (!userId) return res.status(400).json({ msg: "User not identified" });

        await logBillingActivity({
            userId,
            actionType: "logout",
            additionalInfo: `User logged out at ${new Date().toISOString()}`
        });

        res.json({ success: true, msg: "Logout logged successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error" });
    }
};
