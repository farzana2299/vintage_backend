const express = require('express')
const rateLimit = require('express-rate-limit')
const {
	adminRegister,
	adminLogin,
	adminChangePassword,
} = require('../controllers/user.controller')

const router = express.Router()

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		status: false,
		statusCode: 429,
		message: 'Too many login attempts. Please try again after 15 minutes.',
	},
})

router.post('/admin/register', adminRegister)
router.post('/admin/login', loginLimiter, adminLogin)
router.patch('/admin/change-password', adminChangePassword)

module.exports = router
