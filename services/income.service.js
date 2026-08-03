const Income = require('../models/income.model')
const Student = require('../models/student.model')

const validateStudentRequirement = async (incomeType, studentId) => {
	if (incomeType !== 'Others' && !studentId) {
		return {
			status: false,
			statusCode: 400,
			message: 'Student is required for Registration Fees, Class Fees and Test Fees',
		}
	}

	if (studentId) {
		const student = await Student.findById(studentId)
		if (!student) {
			return {
				status: false,
				statusCode: 404,
				message: 'Student not found',
			}
		}
	}

	return { status: true }
}

const createManualIncomeService = async ({ incomeDate, incomeType, student, amount, remarks }) => {
	const validation = await validateStudentRequirement(incomeType, student)
	if (!validation.status) return validation

	const income = await Income.create({
		incomeDate,
		incomeType,
		student: student || undefined,
		amount,
		remarks,
		source: 'Manual',
	})

	const populatedIncome = await Income.findById(income._id).populate(
		'student',
		'name mobileNumber currentStatus'
	)

	return {
		status: true,
		statusCode: 201,
		message: 'Income recorded successfully',
		data: populatedIncome,
	}
}

const getIncomesService = async ({
	search = '',
	student = '',
	incomeType = '',
	source = '',
	incomeDate = '',
	startDate = '',
	endDate = '',
	page = 1,
	limit = 10,
	sortBy = '-incomeDate',
}) => {
	const query = {}

	if (student) {
		query.student = student
	}

	if (incomeType) {
		query.incomeType = incomeType
	}

	if (source) {
		query.source = source
	}

	if (incomeDate) {
		const start = new Date(incomeDate)
		start.setUTCHours(0, 0, 0, 0)
		const end = new Date(incomeDate)
		end.setUTCHours(23, 59, 59, 999)
		query.incomeDate = { $gte: start, $lte: end }
	} else if (startDate || endDate) {
		query.incomeDate = {}
		if (startDate) {
			const start = new Date(startDate)
			start.setUTCHours(0, 0, 0, 0)
			query.incomeDate.$gte = start
		}
		if (endDate) {
			const end = new Date(endDate)
			end.setUTCHours(23, 59, 59, 999)
			query.incomeDate.$lte = end
		}
	}

	if (search) {
		const searchRegex = new RegExp(search, 'i')
		const studentMatches = await Student.find({ name: searchRegex }).select('_id')
		query.student = { $in: studentMatches.map((item) => item._id) }
	}

	const pageNumber = parseInt(page, 10)
	const limitNumber = parseInt(limit, 10)
	const skip = (pageNumber - 1) * limitNumber

	const incomes = await Income.find(query)
		.populate('student', 'name mobileNumber currentStatus')
		.sort(sortBy)
		.skip(skip)
		.limit(limitNumber)

	const total = await Income.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Income list fetched successfully',
		data: {
			incomes,
			pagination: {
				total,
				page: pageNumber,
				limit: limitNumber,
				totalPages: Math.ceil(total / limitNumber),
			},
		},
	}
}

const getDefaultRangeForPeriod = (period) => {
	const now = new Date()

	if (period === 'monthly') {
		const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
		const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
		return { start, end }
	}

	if (period === 'yearly') {
		const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
		const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999))
		return { start, end }
	}

	const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
	const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999))
	return { start, end }
}

const getIncomeSummaryService = async ({ period = 'daily', startDate = '', endDate = '' }) => {
	const dateFormats = {
		daily: '%Y-%m-%d',
		monthly: '%Y-%m',
		yearly: '%Y',
	}

	const format = dateFormats[period] || dateFormats.daily

	const match = {}
	if (startDate || endDate) {
		match.incomeDate = {}
		if (startDate) {
			const start = new Date(startDate)
			start.setUTCHours(0, 0, 0, 0)
			match.incomeDate.$gte = start
		}
		if (endDate) {
			const end = new Date(endDate)
			end.setUTCHours(23, 59, 59, 999)
			match.incomeDate.$lte = end
		}
	} else {
		const { start, end } = getDefaultRangeForPeriod(period)
		match.incomeDate = { $gte: start, $lte: end }
	}

	const summary = await Income.aggregate([
		...(Object.keys(match).length ? [{ $match: match }] : []),
		{
			$group: {
				_id: { $dateToString: { format, date: '$incomeDate', timezone: 'UTC' } },
				totalIncome: { $sum: '$amount' },
				totalEntries: { $sum: 1 },
			},
		},
		{
			$project: {
				_id: 0,
				period: '$_id',
				totalIncome: 1,
				totalEntries: 1,
			},
		},
		{
			$sort: { period: 1 },
		},
	])

	const overallTotal = summary.reduce((sum, item) => sum + item.totalIncome, 0)

	return {
		status: true,
		statusCode: 200,
		message: 'Income summary fetched successfully',
		data: {
			period,
			overallTotal,
			summary,
		},
	}
}

const updateManualIncomeService = async (incomeId, payload) => {
	const income = await Income.findById(incomeId)
	if (!income) {
		return {
			status: false,
			statusCode: 404,
			message: 'Income record not found',
		}
	}

	if (income.source !== 'Manual') {
		return {
			status: false,
			statusCode: 400,
			message: 'Automatic income records cannot be edited manually',
		}
	}

	const updatedIncomeType = payload.incomeType || income.incomeType
	const updatedStudentId = payload.student !== undefined ? payload.student : income.student

	const validation = await validateStudentRequirement(updatedIncomeType, updatedStudentId)
	if (!validation.status) return validation

	if (updatedIncomeType === 'Others' && !updatedStudentId) {
		income.student = undefined
	}

	Object.assign(income, payload)
	await income.save()

	const updatedIncome = await Income.findById(incomeId).populate(
		'student',
		'name mobileNumber currentStatus'
	)

	return {
		status: true,
		statusCode: 200,
		message: 'Income updated successfully',
		data: updatedIncome,
	}
}

const deleteManualIncomeService = async (incomeId) => {
	const income = await Income.findById(incomeId).populate('student', 'name mobileNumber currentStatus')

	if (!income) {
		return {
			status: false,
			statusCode: 404,
			message: 'Income record not found',
		}
	}

	if (income.source !== 'Manual') {
		return {
			status: false,
			statusCode: 400,
			message: 'Automatic income records cannot be deleted manually',
		}
	}

	await Income.findByIdAndDelete(incomeId)

	return {
		status: true,
		statusCode: 200,
		message: 'Income deleted successfully',
		data: income,
	}
}

const paymentTypeToIncomeType = {
	Registration: 'Registration Fees',
	Class: 'Class Fees',
}

const createAutomaticIncomeForPayment = async (payment) => {
	const income = await Income.create({
		incomeDate: payment.paymentDate,
		incomeType: paymentTypeToIncomeType[payment.paymentType],
		student: payment.student,
		amount: payment.amount,
		remarks: 'Auto-generated from Student Payment',
		source: 'Automatic',
		payment: payment._id,
	})

	return income
}

const syncAutomaticIncomeForPayment = async (payment) => {
	const income = await Income.findOne({ payment: payment._id })

	if (!income) {
		return createAutomaticIncomeForPayment(payment)
	}

	income.incomeDate = payment.paymentDate
	income.incomeType = paymentTypeToIncomeType[payment.paymentType]
	income.student = payment.student
	income.amount = payment.amount
	await income.save()

	return income
}

const deleteAutomaticIncomeForPayment = async (paymentId) => {
	await Income.findOneAndDelete({ payment: paymentId })
}

const deleteIncomeForStudent = async (studentId) => {
	await Income.deleteMany({ student: studentId })
}

module.exports = {
	createManualIncomeService,
	getIncomesService,
	getIncomeSummaryService,
	updateManualIncomeService,
	deleteManualIncomeService,
	syncAutomaticIncomeForPayment,
	deleteAutomaticIncomeForPayment,
	deleteIncomeForStudent,
}
