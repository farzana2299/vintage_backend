const Student = require('../models/student.model')
const { generateTestsForStudent, deleteTestsForStudent } = require('./drivingTest.service')

const createStudentService = async (payload) => {
	const student = await Student.create(payload)
	await generateTestsForStudent(student)

	return {
		status: true,
		statusCode: 201,
		message: 'Student registered successfully',
		data: student,
	}
}

const getStudentsService = async ({
	search = '',
	studentType = '',
	currentStatus = '',
	page = 1,
	limit = 10,
	sortBy = '-createdAt',
}) => {
	const query = {}

	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ mobileNumber: { $regex: search, $options: 'i' } },
			{ applicationNumber: { $regex: search, $options: 'i' } },
			{ drivingLicenceNumber: { $regex: search, $options: 'i' } },
			{ place: { $regex: search, $options: 'i' } },
		]
	}

	if (studentType) {
		query.studentType = studentType
	}

	if (currentStatus) {
		query.currentStatus = currentStatus
	}

	const pageNumber = parseInt(page, 10)
	const limitNumber = parseInt(limit, 10)
	const skip = (pageNumber - 1) * limitNumber

	const students = await Student.find(query)
		.sort(sortBy)
		.skip(skip)
		.limit(limitNumber)

	const total = await Student.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Students fetched successfully',
		data: {
			students,
			pagination: {
				total,
				page: pageNumber,
				limit: limitNumber,
				totalPages: Math.ceil(total / limitNumber),
			},
		},
	}
}

const getStudentByIdService = async (studentId) => {
	const student = await Student.findById(studentId)

	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	return {
		status: true,
		statusCode: 200,
		message: 'Student fetched successfully',
		data: student,
	}
}

const updateStudentService = async (studentId, updateData) => {
	const student = await Student.findById(studentId)

	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	Object.assign(student, updateData)
	await student.save()

	if (updateData.classOfVehicle) {
		await generateTestsForStudent(student)
	}

	return {
		status: true,
		statusCode: 200,
		message: 'Student updated successfully',
		data: student,
	}
}

const deleteStudentService = async (studentId) => {
	const student = await Student.findById(studentId)

	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	await Student.findByIdAndDelete(studentId)
	await deleteTestsForStudent(studentId)

	return {
		status: true,
		statusCode: 200,
		message: 'Student deleted successfully',
		data: student,
	}
}

const getActiveStudentsService = async () => {
	const students = await Student.find({ currentStatus: 'In Progress' }).sort({ createdAt: -1 })

	return {
		status: true,
		statusCode: 200,
		message: 'Active students fetched successfully',
		data: {
			students,
		},
	}
}

module.exports = {
	createStudentService,
	getStudentsService,
	getStudentByIdService,
	updateStudentService,
	deleteStudentService,
	getActiveStudentsService,
}
