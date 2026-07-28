const jwt = require('jsonwebtoken');

const jwtMiddleware = (req, res, next) => {
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader) {
        return res.status(401).json({
            status: false,
            statusCode: 401,
            message: 'Authorization Failed! Token not provided'
        });
    }

    const token = tokenHeader.split(" ")[1];

    try {
        const jwtResponse = jwt.verify(token, process.env.JWT_SECRET || "superkey123");
        req.payload = jwtResponse._id;
        next();
    } catch (err) {
        return res.status(401).json({
            status: false,
            statusCode: 401,
            message: 'Authorization Failed! Invalid or expired token'
        });
    }
};

module.exports = { jwtMiddleware };