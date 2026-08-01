const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	getTests,
	getStudentTestHistory,
	updateTest,
} = require('../controllers/drivingTest.controller')

const router = express.Router()

router.get('/tests', jwtMiddleware, getTests)
router.get('/test/student/:studentId', jwtMiddleware, getStudentTestHistory)
router.patch('/test/:testId', jwtMiddleware, updateTest)

module.exports = router
