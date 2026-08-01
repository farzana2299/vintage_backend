const cors = require('cors')
require('dotenv').config()
const express = require('express')
const userRouter = require('./routers/user.router')
const enquiryRouter = require('./routers/enquiry.router')
const trainerRouter = require('./routers/trainer.router')
const studentRouter = require('./routers/student.router')
const attendanceRouter = require('./routers/attendance.router')
const paymentRouter = require('./routers/payment.router')
const incomeRouter = require('./routers/income.router')
const expenseRouter = require('./routers/expense.router')
const errorMiddleware = require('./middleware/error')
const server = express()

require('./database/connection')

server.use(cors())
server.use(express.json())
server.use(userRouter)
server.use(enquiryRouter)
server.use(trainerRouter)
server.use(studentRouter)
server.use(attendanceRouter)
server.use(paymentRouter)
server.use(incomeRouter)
server.use(expenseRouter)
server.use('/uploads', express.static('./uploads'))
server.use('/resumes',express.static('./resumes'))
server.use(errorMiddleware)

const port = process.env.PORT || 4000
server.listen(port, () => {
    console.log(`------Server is running on port http://localhost:${port}--------`);
})