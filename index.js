const cors = require('cors')
require('dotenv').config()
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')
const userRouter = require('./routers/user.router')
const enquiryRouter = require('./routers/enquiry.router')
const trainerRouter = require('./routers/trainer.router')
const studentRouter = require('./routers/student.router')
const attendanceRouter = require('./routers/attendance.router')
const paymentRouter = require('./routers/payment.router')
const incomeRouter = require('./routers/income.router')
const expenseRouter = require('./routers/expense.router')
const drivingTestRouter = require('./routers/drivingTest.router')
const dashboardRouter = require('./routers/dashboard.router')
const errorMiddleware = require('./middleware/error')
const server = express()

require('./database/connection')

const normalizeOrigin = (value) => value.trim().replace(/\/+$/, '')

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
	.split(',')
	.map(normalizeOrigin)
	.filter(Boolean)

server.use(
	cors({
		origin: (origin, callback) => {
			// Allow non-browser requests (no Origin header, e.g. curl/Postman/server-to-server)
			if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
				return callback(null, true)
			}
			return callback(new Error('Not allowed by CORS'))
		},
	})
)
server.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
server.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
server.use(express.json())

server.get('/health', (req, res) => {
	const dbConnected = mongoose.connection.readyState === 1
	res.status(dbConnected ? 200 : 503).json({
		status: dbConnected,
		statusCode: dbConnected ? 200 : 503,
		message: dbConnected ? 'OK' : 'Database not connected',
		uptime: process.uptime(),
	})
})

server.use(userRouter)
server.use(enquiryRouter)
server.use(trainerRouter)
server.use(studentRouter)
server.use(attendanceRouter)
server.use(paymentRouter)
server.use(incomeRouter)
server.use(expenseRouter)
server.use(drivingTestRouter)
server.use(dashboardRouter)
server.use('/uploads', express.static('./uploads'))
server.use('/resumes',express.static('./resumes'))
server.use(errorMiddleware)

const port = process.env.PORT || 4000
server.listen(port, () => {
    console.log(`------Server is running on port http://localhost:${port}--------`);
})