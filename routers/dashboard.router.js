const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const { getDashboard, getRoadSafetyPendingCount } = require('../controllers/dashboard.controller')

const router = express.Router()

router.get('/dashboard', jwtMiddleware, getDashboard)
router.get('/dashboard/road-safety-pending', jwtMiddleware, getRoadSafetyPendingCount)

module.exports = router
