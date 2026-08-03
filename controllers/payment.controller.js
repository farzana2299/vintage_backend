const {
	createPaymentService,
	getPaymentsService,
	getStudentPaymentHistoryService,
	getPaymentStudentsSummaryService,
	updatePaymentService,
	deletePaymentService,
} = require('../services/payment.service')

const createPayment = async (req, res, next) => {
	try {
		const { student, studentId, paymentType, classNumber, amount, paymentDate } = req.body

		const selectedStudent = student || studentId

		if (!selectedStudent || !paymentType || !amount || !paymentDate) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide studentId/student, paymentType, amount and paymentDate',
			})
		}

		if (paymentType === 'Class' && !classNumber) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'classNumber is required when paymentType is Class',
			})
		}

		const result = await createPaymentService({
			student: selectedStudent,
			paymentType,
			classNumber,
			amount,
			paymentDate,
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

const getPayments = async (req, res, next) => {
	try {
		const {
			search = '',
			student = '',
			studentId = '',
			paymentType = '',
			paymentDate = '',
			startDate = '',
			endDate = '',
			page = 1,
			limit = 10,
			sortBy = '-paymentDate',
		} = req.query

		const result = await getPaymentsService({
			search,
			student: student || studentId,
			paymentType,
			paymentDate,
			startDate,
			endDate,
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

const getStudentPaymentHistory = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const result = await getStudentPaymentHistoryService(studentId)

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

const getPaymentStudentsSummary = async (req, res, next) => {
	try {
		const result = await getPaymentStudentsSummaryService()

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

const updatePayment = async (req, res, next) => {
	try {
		const { paymentId } = req.params
		const payload = { ...req.body }

		if (payload.studentId && !payload.student) {
			payload.student = payload.studentId
		}

		delete payload.studentId

		const result = await updatePaymentService(paymentId, payload)

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

const deletePayment = async (req, res, next) => {
	try {
		const { paymentId } = req.params
		const result = await deletePaymentService(paymentId)

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
	createPayment,
	getPayments,
	getStudentPaymentHistory,
	getPaymentStudentsSummary,
	updatePayment,
	deletePayment,
}
