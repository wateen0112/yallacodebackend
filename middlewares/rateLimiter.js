const rateLimit = require('express-rate-limit');

// Rate limiter middleware: 5 requests per minute per IP
const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 555555,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

module.exports = rateLimiter;