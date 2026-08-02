const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	getTestsSummaryList,
	getStudentTestDetail,
	bulkScheduleTests,
	recordTestResult,
	rescheduleTest,
	getTestHistory,
} = require('../controllers/drivingTest.controller')

const router = express.Router()

router.get('/tests/summary', jwtMiddleware, getTestsSummaryList)
router.get('/test/student/:studentId', jwtMiddleware, getStudentTestDetail)
router.patch('/test/student/:studentId/schedule', jwtMiddleware, bulkScheduleTests)
router.patch('/test/:testId/result', jwtMiddleware, recordTestResult)
router.patch('/test/:testId/reschedule', jwtMiddleware, rescheduleTest)
router.get('/test/:testId/history', jwtMiddleware, getTestHistory)

module.exports = router
