const Attendance = require('../models/attendance.model')
const Student = require('../models/student.model')
const Trainer = require('../models/trainer.model')

const ensureEligibleStudentAndTrainer = async (studentId, trainerId) => {
	const student = await Student.findOne({ _id: studentId, currentStatus: 'In Progress' })
	if (!student) {
		return {
			status: false,
			statusCode: 400,
			message: 'Student not found or not active (In Progress)',
		}
	}

	const trainer = await Trainer.findOne({ _id: trainerId, activeStatus: 'Active' })
	if (!trainer) {
		return {
			status: false,
			statusCode: 400,
			message: 'Trainer not found or not active',
		}
	}

	return { status: true }
}

const createAttendanceService = async ({ student, classNumber, classDate, trainer, remarks }) => {
	const eligibility = await ensureEligibleStudentAndTrainer(student, trainer)
	if (!eligibility.status) return eligibility

	const existingClass = await Attendance.findOne({ student, classNumber })
	if (existingClass) {
		return {
			status: false,
			statusCode: 409,
			message: 'Class number already exists for this student',
		}
	}

	const attendance = await Attendance.create({
		student,
		classNumber,
		classDate,
		trainer,
		remarks,
	})

	const populatedAttendance = await Attendance.findById(attendance._id)
		.populate('student', 'name mobileNumber currentStatus')
		.populate('trainer', 'trainerName phoneNumber activeStatus')

	return {
		status: true,
		statusCode: 201,
		message: 'Attendance recorded successfully',
		data: populatedAttendance,
	}
}

const getAttendancesService = async ({
	search = '',
	student = '',
	trainer = '',
	classDate = '',
	page = 1,
	limit = 10,
	sortBy = '-classDate',
}) => {
	const query = {}

	if (student) {
		query.student = student
	}

	if (trainer) {
		query.trainer = trainer
	}

	if (classDate) {
		const start = new Date(classDate)
		start.setHours(0, 0, 0, 0)
		const end = new Date(classDate)
		end.setHours(23, 59, 59, 999)
		query.classDate = { $gte: start, $lte: end }
	}

	if (search) {
		const searchRegex = new RegExp(search, 'i')
		const searchAsNumber = Number(search)

		const studentMatches = await Student.find({ name: searchRegex }).select('_id')
		const trainerMatches = await Trainer.find({ trainerName: searchRegex }).select('_id')

		query.$or = [
			{ student: { $in: studentMatches.map((item) => item._id) } },
			{ trainer: { $in: trainerMatches.map((item) => item._id) } },
		]

		if (!Number.isNaN(searchAsNumber)) {
			query.$or.push({ classNumber: searchAsNumber })
		}
	}

	const pageNumber = parseInt(page, 10)
	const limitNumber = parseInt(limit, 10)
	const skip = (pageNumber - 1) * limitNumber

	const attendances = await Attendance.find(query)
		.populate('student', 'name mobileNumber currentStatus')
		.populate('trainer', 'trainerName phoneNumber activeStatus')
		.sort(sortBy)
		.skip(skip)
		.limit(limitNumber)

	const total = await Attendance.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Attendance list fetched successfully',
		data: {
			attendances,
			pagination: {
				total,
				page: pageNumber,
				limit: limitNumber,
				totalPages: Math.ceil(total / limitNumber),
			},
		},
	}
}

const getStudentAttendanceHistoryService = async (studentId) => {
	const student = await Student.findById(studentId)
	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	const attendances = await Attendance.find({ student: studentId })
		.populate('student', 'name mobileNumber currentStatus')
		.populate('trainer', 'trainerName phoneNumber activeStatus')
		.sort({ classNumber: 1 })

	return {
		status: true,
		statusCode: 200,
		message: 'Student attendance history fetched successfully',
		data: {
			student,
			attendances,
		},
	}
}

const updateAttendanceService = async (attendanceId, payload) => {
	const attendance = await Attendance.findById(attendanceId)
	if (!attendance) {
		return {
			status: false,
			statusCode: 404,
			message: 'Attendance record not found',
		}
	}

	const updatedStudentId = payload.student || attendance.student.toString()
	const updatedTrainerId = payload.trainer || attendance.trainer.toString()
	const eligibility = await ensureEligibleStudentAndTrainer(updatedStudentId, updatedTrainerId)
	if (!eligibility.status) return eligibility

	if (payload.classNumber && payload.classNumber !== attendance.classNumber) {
		const duplicateClass = await Attendance.findOne({
			student: updatedStudentId,
			classNumber: payload.classNumber,
			_id: { $ne: attendanceId },
		})

		if (duplicateClass) {
			return {
				status: false,
				statusCode: 409,
				message: 'Class number already exists for this student',
			}
		}
	}

	Object.assign(attendance, payload)
	await attendance.save()

	const updatedAttendance = await Attendance.findById(attendanceId)
		.populate('student', 'name mobileNumber currentStatus')
		.populate('trainer', 'trainerName phoneNumber activeStatus')

	return {
		status: true,
		statusCode: 200,
		message: 'Attendance updated successfully',
		data: updatedAttendance,
	}
}

const deleteAttendanceService = async (attendanceId) => {
	const attendance = await Attendance.findById(attendanceId)
		.populate('student', 'name mobileNumber currentStatus')
		.populate('trainer', 'trainerName phoneNumber activeStatus')

	if (!attendance) {
		return {
			status: false,
			statusCode: 404,
			message: 'Attendance record not found',
		}
	}

	await Attendance.findByIdAndDelete(attendanceId)

	return {
		status: true,
		statusCode: 200,
		message: 'Attendance deleted successfully',
		data: attendance,
	}
}

module.exports = {
	createAttendanceService,
	getAttendancesService,
	getStudentAttendanceHistoryService,
	updateAttendanceService,
	deleteAttendanceService,
}
