const express = require('express')
const {
	adminRegister,
	adminLogin,
	adminChangePassword,
} = require('../controllers/user.controller')

const router = express.Router()

router.post('/admin/register', adminRegister)
router.post('/admin/login', adminLogin)
router.patch('/admin/change-password', adminChangePassword)

module.exports = router
