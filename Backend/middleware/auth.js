const jwt = require('jsonwebtoken');
const BillingUser = require('../models/BillingUser');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await BillingUser.findById(decoded.id).select('-password');
            next();
        } catch (err) {
            console.error(err);
            res.status(401).json({ msg: "Not authorized" });
        }
    } else {
        res.status(401).json({ msg: "No token" });
    }
};

module.exports = protect;
