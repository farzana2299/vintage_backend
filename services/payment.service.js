const Payment = require('../models/payment.model')
const Student = require('../models/student.model')
const Attendance = require('../models/attendance.model')
const {
	syncAutomaticIncomeForPayment,
	deleteAutomaticIncomeForPayment,
} = require('./income.service')

const ensureActiveStudent = async (studentId) => {
	const student = await Student.findOne({ _id: studentId, currentStatus: 'In Progress' })
	if (!student) {
		return {
			status: false,
			statusCode: 400,
			message: 'Student not found or not active',
		}
	}

	return { status: true }
}

const createPaymentService = async ({ student, paymentType, classNumber, amount, paymentDate }) => {
	const eligibility = await ensureActiveStudent(student)
	if (!eligibility.status) return eligibility

	if (paymentType === 'Class' && !classNumber) {
		return {
			status: false,
			statusCode: 400,
			message: 'Class number is required when payment type is Class',
		}
	}

	const dayStart = new Date(paymentDate)
	dayStart.setHours(0, 0, 0, 0)
	const dayEnd = new Date(paymentDate)
	dayEnd.setHours(23, 59, 59, 999)

	const existingPayment = await Payment.findOne({
		student,
		paymentType,
		paymentDate: { $gte: dayStart, $lte: dayEnd },
	})

	if (existingPayment) {
		existingPayment.amount += amount
		if (paymentType === 'Class') {
			existingPayment.classNumber += classNumber
		}
		await existingPayment.save()
		await syncAutomaticIncomeForPayment(existingPayment)

		const updatedPayment = await Payment.findById(existingPayment._id).populate(
			'student',
			'name mobileNumber currentStatus'
		)

		return {
			status: true,
			statusCode: 200,
			message: 'Existing payment for this date updated successfully',
			data: updatedPayment,
		}
	}

	const payment = await Payment.create({
		student,
		paymentType,
		classNumber: paymentType === 'Class' ? classNumber : undefined,
		amount,
		paymentDate,
	})
	await syncAutomaticIncomeForPayment(payment)

	const populatedPayment = await Payment.findById(payment._id).populate(
		'student',
		'name mobileNumber currentStatus'
	)

	return {
		status: true,
		statusCode: 201,
		message: 'Payment recorded successfully',
		data: populatedPayment,
	}
}

const getPaymentsService = async ({
	search = '',
	student = '',
	paymentType = '',
	paymentDate = '',
	startDate = '',
	endDate = '',
	page = 1,
	limit = 10,
	sortBy = '-paymentDate',
}) => {
	const query = {}

	if (student) {
		query.student = student
	}

	if (paymentType) {
		query.paymentType = paymentType
	}

	if (paymentDate) {
		const start = new Date(paymentDate)
		start.setHours(0, 0, 0, 0)
		const end = new Date(paymentDate)
		end.setHours(23, 59, 59, 999)
		query.paymentDate = { $gte: start, $lte: end }
	} else if (startDate || endDate) {
		query.paymentDate = {}
		if (startDate) {
			const start = new Date(startDate)
			start.setHours(0, 0, 0, 0)
			query.paymentDate.$gte = start
		}
		if (endDate) {
			const end = new Date(endDate)
			end.setHours(23, 59, 59, 999)
			query.paymentDate.$lte = end
		}
	}

	if (search) {
		const searchRegex = new RegExp(search, 'i')
		const studentMatches = await Student.find({ name: searchRegex }).select('_id')

		query.$or = [
			{ student: { $in: studentMatches.map((item) => item._id) } },
			{ paymentType: searchRegex },
		]
	}

	const pageNumber = parseInt(page, 10)
	const limitNumber = parseInt(limit, 10)
	const skip = (pageNumber - 1) * limitNumber

	const payments = await Payment.find(query)
		.populate('student', 'name mobileNumber currentStatus')
		.sort(sortBy)
		.skip(skip)
		.limit(limitNumber)

	const total = await Payment.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Payment list fetched successfully',
		data: {
			payments,
			pagination: {
				total,
				page: pageNumber,
				limit: limitNumber,
				totalPages: Math.ceil(total / limitNumber),
			},
		},
	}
}

const getStudentPaymentHistoryService = async (studentId) => {
	const student = await Student.findById(studentId)
	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	const payments = await Payment.find({ student: studentId }).sort({ paymentDate: -1 })

	const studentDetails = {
		studentId: student._id,
		name: student.name,
		phoneNumber: student.mobileNumber,
		place: student.place,
	}

	const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)

	const classPayments = payments.filter((payment) => payment.paymentType === 'Class')
	const totalClassesPaid = classPayments.reduce((sum, payment) => sum + payment.classNumber, 0)
	const totalAmountPaidForClass = classPayments.reduce((sum, payment) => sum + payment.amount, 0)

	const attendanceRecords = await Attendance.find({ student: studentId })
	const totalClassesAttended = attendanceRecords.reduce((sum, record) => sum + record.classNumber, 0)

	return {
		status: true,
		statusCode: 200,
		message: 'Student payment history fetched successfully',
		data: {
			studentDetails,
			totalPaid,
			totalClassesAttended,
			totalClassesPaid,
			totalAmountPaidForClass,
			payments,
		},
	}
}

const getPaymentStudentsSummaryService = async () => {
	const summary = await Payment.aggregate([
		{
			$group: {
				_id: '$student',
				totalPaymentDone: { $sum: '$amount' },
			},
		},
		{
			$lookup: {
				from: 'students',
				localField: '_id',
				foreignField: '_id',
				as: 'student',
			},
		},
		{
			$unwind: '$student',
		},
		{
			$lookup: {
				from: 'attendances',
				localField: '_id',
				foreignField: 'student',
				as: 'attendanceRecords',
			},
		},
		{
			$project: {
				_id: 0,
				studentId: '$student._id',
				studentName: '$student.name',
				place: '$student.place',
				mobileNumber: '$student.mobileNumber',
				totalPaymentDone: 1,
				totalClassAttended: { $size: '$attendanceRecords' },
			},
		},
		{
			$sort: { studentName: 1 },
		},
	])

	return {
		status: true,
		statusCode: 200,
		message: 'Payment student summary fetched successfully',
		data: {
			summary,
		},
	}
}

const updatePaymentService = async (paymentId, payload) => {
	const payment = await Payment.findById(paymentId)
	if (!payment) {
		return {
			status: false,
			statusCode: 404,
			message: 'Payment record not found',
		}
	}

	const updatedStudentId = payload.student || payment.student.toString()
	const eligibility = await ensureActiveStudent(updatedStudentId)
	if (!eligibility.status) return eligibility

	const updatedPaymentType = payload.paymentType || payment.paymentType
	const updatedClassNumber = payload.classNumber !== undefined ? payload.classNumber : payment.classNumber

	if (updatedPaymentType === 'Class' && !updatedClassNumber) {
		return {
			status: false,
			statusCode: 400,
			message: 'Class number is required when payment type is Class',
		}
	}

	if (updatedPaymentType === 'Registration') {
		payment.classNumber = undefined
	}

	Object.assign(payment, payload)
	await payment.save()
	await syncAutomaticIncomeForPayment(payment)

	const updatedPayment = await Payment.findById(paymentId).populate(
		'student',
		'name mobileNumber currentStatus'
	)

	return {
		status: true,
		statusCode: 200,
		message: 'Payment updated successfully',
		data: updatedPayment,
	}
}

const deletePaymentService = async (paymentId) => {
	const payment = await Payment.findById(paymentId).populate(
		'student',
		'name mobileNumber currentStatus'
	)

	if (!payment) {
		return {
			status: false,
			statusCode: 404,
			message: 'Payment record not found',
		}
	}

	await Payment.findByIdAndDelete(paymentId)
	await deleteAutomaticIncomeForPayment(paymentId)

	return {
		status: true,
		statusCode: 200,
		message: 'Payment deleted successfully',
		data: payment,
	}
}

const deletePaymentsForStudent = async (studentId) => {
	await Payment.deleteMany({ student: studentId })
}

module.exports = {
	createPaymentService,
	getPaymentsService,
	getStudentPaymentHistoryService,
	getPaymentStudentsSummaryService,
	updatePaymentService,
	deletePaymentService,
	deletePaymentsForStudent,
}
