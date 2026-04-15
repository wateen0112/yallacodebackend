const errorMiddleware = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error
    console.error(err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = { message, statusCode: 404 };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, statusCode: 400 };
    }

    // Multer error
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = { message: 'File too large. Max size is 2MB', statusCode: 400 };
        } else {
            error = { message: err.message, statusCode: 400 };
        }
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
    });
};

module.exports = errorMiddleware;