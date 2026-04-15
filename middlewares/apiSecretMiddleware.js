const crypto = require('crypto');

const apiSecretMiddleware = (req, res, next) => {
    const expectedSecret = process.env.API_SECRET;
    const providedSecret = req.headers['x-api-secret'];

    if (!expectedSecret) {
        return res.status(500).json({
            success: false,
            message: 'Server API secret is not configured'
        });
    }

    if (!providedSecret) {
        return res.status(401).json({
            success: false,
            message: 'Missing API secret'
        });
    }

    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');
    const providedBuffer = Buffer.from(providedSecret, 'utf8');

    if (
        expectedBuffer.length !== providedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API secret'
        });
    }

    next();
};

module.exports = apiSecretMiddleware;
