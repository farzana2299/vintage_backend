const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const { getDashboard } = require('../controllers/dashboard.controller')

const router = express.Router()

router.get('/dashboard', jwtMiddleware, getDashboard)

module.exports = router
