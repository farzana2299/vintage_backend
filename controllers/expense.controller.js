const {
	createExpenseService,
	getExpensesService,
	getExpenseSummaryService,
	updateExpenseService,
	deleteExpenseService,
} = require('../services/expense.service')

const createExpense = async (req, res, next) => {
	try {
		const { expenseDate, expenseType, staff, staffId, student, studentId, amount, remarks } = req.body

		const selectedStaff = staff || staffId
		const selectedStudent = student || studentId

		if (!expenseDate || !expenseType || !amount) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide expenseDate, expenseType and amount',
			})
		}

		if (expenseType === 'Staff Salary' && !selectedStaff) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'staffId/staff is required when expenseType is Staff Salary',
			})
		}

		if (expenseType === 'RTO Fees' && !selectedStudent) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'studentId/student is required when expenseType is RTO Fees',
			})
		}

		const result = await createExpenseService({
			expenseDate,
			expenseType,
			staff: selectedStaff,
			student: selectedStudent,
			amount,
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

const getExpenses = async (req, res, next) => {
	try {
		const {
			search = '',
			staff = '',
			staffId = '',
			student = '',
			studentId = '',
			expenseType = '',
			expenseDate = '',
			startDate = '',
			endDate = '',
			page = 1,
			limit = 10,
			sortBy = '-expenseDate',
		} = req.query

		const result = await getExpensesService({
			search,
			staff: staff || staffId,
			student: student || studentId,
			expenseType,
			expenseDate,
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

const getExpenseSummary = async (req, res, next) => {
	try {
		const { period = 'daily', startDate = '', endDate = '' } = req.query

		const result = await getExpenseSummaryService({ period, startDate, endDate })

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

const updateExpense = async (req, res, next) => {
	try {
		const { expenseId } = req.params
		const payload = { ...req.body }

		if (payload.staffId && !payload.staff) {
			payload.staff = payload.staffId
		}

		if (payload.studentId && !payload.student) {
			payload.student = payload.studentId
		}

		delete payload.staffId
		delete payload.studentId

		const result = await updateExpenseService(expenseId, payload)

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

const deleteExpense = async (req, res, next) => {
	try {
		const { expenseId } = req.params
		const result = await deleteExpenseService(expenseId)

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
	createExpense,
	getExpenses,
	getExpenseSummary,
	updateExpense,
	deleteExpense,
}
