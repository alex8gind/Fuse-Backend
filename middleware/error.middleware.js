
const errorHandler = (err, req, res, next) => {
    console.error(err);

    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err.name === 'ValidationError') {
        // Mongoose validation error
        statusCode = 400;
        message = Object.values(err.errors).map(error => error.message).join(', ');
    } else if (err.code === 11000) {
        // Duplicate key error
        statusCode = 409;
        message = 'Duplicate field value entered';
    } else if (err.name === 'CastError') {
        // Cast error (usually invalid ID)
        statusCode = 400;
        message = 'Invalid ID format';
    } else if (err.message) {
        // Custom error messages from your services
        statusCode = 400;
        message = err.message;
    }

    res.status(statusCode).json({
        error: {
            message: message,
            stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
        }
    });
};

module.exports = errorHandler;