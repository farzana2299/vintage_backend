const {
	createAttendanceService,
	getAttendancesService,
	getStudentAttendanceHistoryService,
	updateAttendanceService,
	deleteAttendanceService,
} = require('../services/attendance.service')

const createAttendance = async (req, res, next) => {
	try {
		const {
			student,
			studentId,
			classNumber,
			classDate,
			trainer,
			trainerId,
			remarks,
		} = req.body

		const selectedStudent = student || studentId
		const selectedTrainer = trainer || trainerId

		if (!selectedStudent || !classNumber || !classDate || !selectedTrainer) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide studentId/student, classNumber, classDate and trainerId/trainer',
			})
		}

		const result = await createAttendanceService({
			student: selectedStudent,
			classNumber,
			classDate,
			trainer: selectedTrainer,
			remarks,
		})

		if (!result.status) {
			return res.status(result.statusCode).json({
				status: result.status,
				statusCode: result.statusCode,
				message: result.message,
			})
		}

		return res.status(result.statusCode).json({
			status: result.status,
			statusCode: result.statusCode,
			message: result.message,
			data: result.data,
		})
	} catch (error) {
		next(error)
	}
}

const getAttendances = async (req, res, next) => {
	try {
		const {
			search = '',
			student = '',
			studentId = '',
			trainer = '',
			trainerId = '',
			classDate = '',
			page = 1,
			limit = 10,
			sortBy = '-classDate',
		} = req.query

		const result = await getAttendancesService({
			search,
			student: student || studentId,
			trainer: trainer || trainerId,
			classDate,
			page,
			limit,
			sortBy,
		})

		return res.status(result.statusCode).json({
			status: result.status,
			statusCode: result.statusCode,
			message: result.message,
			...result.data,
		})
	} catch (error) {
		next(error)
	}
}

const getStudentAttendanceHistory = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const result = await getStudentAttendanceHistoryService(studentId)

		if (!result.status) {
			return res.status(result.statusCode).json({
				status: result.status,
				statusCode: result.statusCode,
				message: result.message,
			})
		}

		return res.status(result.statusCode).json({
			status: result.status,
			statusCode: result.statusCode,
			message: result.message,
			...result.data,
		})
	} catch (error) {
		next(error)
	}
}

const updateAttendance = async (req, res, next) => {
	try {
		const { attendanceId } = req.params
		const payload = { ...req.body }

		if (payload.studentId && !payload.student) {
			payload.student = payload.studentId
		}

		if (payload.trainerId && !payload.trainer) {
			payload.trainer = payload.trainerId
		}

		delete payload.studentId
		delete payload.trainerId

		const result = await updateAttendanceService(attendanceId, payload)

		if (!result.status) {
			return res.status(result.statusCode).json({
				status: result.status,
				statusCode: result.statusCode,
				message: result.message,
			})
		}

		return res.status(result.statusCode).json({
			status: result.status,
			statusCode: result.statusCode,
			message: result.message,
			data: result.data,
		})
	} catch (error) {
		next(error)
	}
}

const deleteAttendance = async (req, res, next) => {
	try {
		const { attendanceId } = req.params
		const result = await deleteAttendanceService(attendanceId)

		if (!result.status) {
			return res.status(result.statusCode).json({
				status: result.status,
				statusCode: result.statusCode,
				message: result.message,
			})
		}

		return res.status(result.statusCode).json({
			status: result.status,
			statusCode: result.statusCode,
			message: result.message,
			data: result.data,
		})
	} catch (error) {
		next(error)
	}
}

module.exports = {
	createAttendance,
	getAttendances,
	getStudentAttendanceHistory,
	updateAttendance,
	deleteAttendance,
}
