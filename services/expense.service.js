const Expense = require('../models/expense.model')
const Trainer = require('../models/trainer.model')

const validateStaffRequirement = async (expenseType, staffId) => {
	if (expenseType === 'Staff Salary' && !staffId) {
		return {
			status: false,
			statusCode: 400,
			message: 'Staff name is required when expense type is Staff Salary',
		}
	}

	if (staffId) {
		const staff = await Trainer.findById(staffId)
		if (!staff) {
			return {
				status: false,
				statusCode: 404,
				message: 'Staff not found',
			}
		}
	}

	return { status: true }
}

const createExpenseService = async ({ expenseDate, expenseType, staff, amount, remarks }) => {
	const validation = await validateStaffRequirement(expenseType, staff)
	if (!validation.status) return validation

	const expense = await Expense.create({
		expenseDate,
		expenseType,
		staff: staff || undefined,
		amount,
		remarks,
	})

	const populatedExpense = await Expense.findById(expense._id).populate(
		'staff',
		'trainerName phoneNumber activeStatus'
	)

	return {
		status: true,
		statusCode: 201,
		message: 'Expense recorded successfully',
		data: populatedExpense,
	}
}

const getExpensesService = async ({
	search = '',
	staff = '',
	expenseType = '',
	expenseDate = '',
	startDate = '',
	endDate = '',
	page = 1,
	limit = 10,
	sortBy = '-expenseDate',
}) => {
	const query = {}

	if (staff) {
		query.staff = staff
	}

	if (expenseType) {
		query.expenseType = expenseType
	}

	if (expenseDate) {
		const start = new Date(expenseDate)
		start.setUTCHours(0, 0, 0, 0)
		const end = new Date(expenseDate)
		end.setUTCHours(23, 59, 59, 999)
		query.expenseDate = { $gte: start, $lte: end }
	} else if (startDate || endDate) {
		query.expenseDate = {}
		if (startDate) {
			const start = new Date(startDate)
			start.setUTCHours(0, 0, 0, 0)
			query.expenseDate.$gte = start
		}
		if (endDate) {
			const end = new Date(endDate)
			end.setUTCHours(23, 59, 59, 999)
			query.expenseDate.$lte = end
		}
	}

	if (search) {
		const searchRegex = new RegExp(search, 'i')
		const staffMatches = await Trainer.find({ trainerName: searchRegex }).select('_id')

		query.$or = [
			{ staff: { $in: staffMatches.map((item) => item._id) } },
			{ expenseType: searchRegex },
		]
	}

	const pageNumber = parseInt(page, 10)
	const limitNumber = parseInt(limit, 10)
	const skip = (pageNumber - 1) * limitNumber

	const expenses = await Expense.find(query)
		.populate('staff', 'trainerName phoneNumber activeStatus')
		.sort(sortBy)
		.skip(skip)
		.limit(limitNumber)

	const total = await Expense.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Expense list fetched successfully',
		data: {
			expenses,
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

const getExpenseSummaryService = async ({ period = 'daily', startDate = '', endDate = '' }) => {
	const dateFormats = {
		daily: '%Y-%m-%d',
		monthly: '%Y-%m',
		yearly: '%Y',
	}

	const format = dateFormats[period] || dateFormats.daily

	const match = {}
	if (startDate || endDate) {
		match.expenseDate = {}
		if (startDate) {
			const start = new Date(startDate)
			start.setUTCHours(0, 0, 0, 0)
			match.expenseDate.$gte = start
		}
		if (endDate) {
			const end = new Date(endDate)
			end.setUTCHours(23, 59, 59, 999)
			match.expenseDate.$lte = end
		}
	} else {
		const { start, end } = getDefaultRangeForPeriod(period)
		match.expenseDate = { $gte: start, $lte: end }
	}

	const summary = await Expense.aggregate([
		{ $match: match },
		{
			$group: {
				_id: { $dateToString: { format, date: '$expenseDate', timezone: 'UTC' } },
				totalExpense: { $sum: '$amount' },
				totalEntries: { $sum: 1 },
			},
		},
		{
			$project: {
				_id: 0,
				period: '$_id',
				totalExpense: 1,
				totalEntries: 1,
			},
		},
		{
			$sort: { period: 1 },
		},
	])

	const overallTotal = summary.reduce((sum, item) => sum + item.totalExpense, 0)

	return {
		status: true,
		statusCode: 200,
		message: 'Expense summary fetched successfully',
		data: {
			period,
			overallTotal,
			summary,
		},
	}
}

const updateExpenseService = async (expenseId, payload) => {
	const expense = await Expense.findById(expenseId)
	if (!expense) {
		return {
			status: false,
			statusCode: 404,
			message: 'Expense record not found',
		}
	}

	const updatedExpenseType = payload.expenseType || expense.expenseType
	const updatedStaffId = payload.staff !== undefined ? payload.staff : expense.staff

	const validation = await validateStaffRequirement(updatedExpenseType, updatedStaffId)
	if (!validation.status) return validation

	if (updatedExpenseType !== 'Staff Salary' && !payload.staff) {
		expense.staff = undefined
	}

	Object.assign(expense, payload)
	await expense.save()

	const updatedExpense = await Expense.findById(expenseId).populate(
		'staff',
		'trainerName phoneNumber activeStatus'
	)

	return {
		status: true,
		statusCode: 200,
		message: 'Expense updated successfully',
		data: updatedExpense,
	}
}

const deleteExpenseService = async (expenseId) => {
	const expense = await Expense.findById(expenseId).populate(
		'staff',
		'trainerName phoneNumber activeStatus'
	)

	if (!expense) {
		return {
			status: false,
			statusCode: 404,
			message: 'Expense record not found',
		}
	}

	await Expense.findByIdAndDelete(expenseId)

	return {
		status: true,
		statusCode: 200,
		message: 'Expense deleted successfully',
		data: expense,
	}
}

module.exports = {
	createExpenseService,
	getExpensesService,
	getExpenseSummaryService,
	updateExpenseService,
	deleteExpenseService,
}
