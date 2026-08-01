const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	createPayment,
	getPayments,
	getStudentPaymentHistory,
	getPaymentStudentsSummary,
	updatePayment,
	deletePayment,
} = require('../controllers/payment.controller')

const router = express.Router()

router.post('/payment', jwtMiddleware, createPayment)
router.get('/payments', jwtMiddleware, getPayments)
router.get('/payment/students', jwtMiddleware, getPaymentStudentsSummary)
router.get('/payment/student/:studentId', jwtMiddleware, getStudentPaymentHistory)
router.patch('/payment/:paymentId', jwtMiddleware, updatePayment)
router.delete('/payment/:paymentId', jwtMiddleware, deletePayment)

module.exports = router
