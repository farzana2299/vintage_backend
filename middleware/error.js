const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || (err.name === 'MulterError' ? 400 : 500)
    const message = err.message || 'Internal server error'

    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${statusCode}`, err)

    res.status(statusCode).json({
        status: false,
        statusCode,
        message,
    })
}

module.exports = errorMiddleware
