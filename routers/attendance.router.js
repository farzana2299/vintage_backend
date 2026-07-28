const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	createAttendance,
	getAttendances,
	getStudentAttendanceHistory,
	getAttendanceStudentsSummary,
	updateAttendance,
	deleteAttendance,
} = require('../controllers/attendance.controller')

const router = express.Router()

router.post('/attendance', jwtMiddleware, createAttendance)
router.get('/attendances', jwtMiddleware, getAttendances)
router.get('/attendance/students', jwtMiddleware, getAttendanceStudentsSummary)
router.get('/attendance/student/:studentId', jwtMiddleware, getStudentAttendanceHistory)
router.patch('/attendance/:attendanceId', jwtMiddleware, updateAttendance)
router.delete('/attendance/:attendanceId', jwtMiddleware, deleteAttendance)

module.exports = router
