const {
	createManualIncomeService,
	getIncomesService,
	getIncomeSummaryService,
	updateManualIncomeService,
	deleteManualIncomeService,
} = require('../services/income.service')

const createIncome = async (req, res, next) => {
	try {
		const { incomeDate, incomeType, student, studentId, amount, remarks } = req.body

		const selectedStudent = student || studentId

		if (!incomeDate || !incomeType || !amount) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide incomeDate, incomeType and amount',
			})
		}

		if (incomeType !== 'Others' && !selectedStudent) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'studentId/student is required for Registration Fees, Class Fees and Test Fees',
			})
		}

		const result = await createManualIncomeService({
			incomeDate,
			incomeType,
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

const getIncomes = async (req, res, next) => {
	try {
		const {
			search = '',
			student = '',
			studentId = '',
			incomeType = '',
			source = '',
			incomeDate = '',
			startDate = '',
			endDate = '',
			page = 1,
			limit = 10,
			sortBy = '-incomeDate',
		} = req.query

		const result = await getIncomesService({
			search,
			student: student || studentId,
			incomeType,
			source,
			incomeDate,
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

const getIncomeSummary = async (req, res, next) => {
	try {
		const { period = 'daily', startDate = '', endDate = '' } = req.query

		const result = await getIncomeSummaryService({ period, startDate, endDate })

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

const updateIncome = async (req, res, next) => {
	try {
		const { incomeId } = req.params
		const payload = { ...req.body }

		if (payload.studentId && !payload.student) {
			payload.student = payload.studentId
		}

		delete payload.studentId

		const result = await updateManualIncomeService(incomeId, payload)

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

const deleteIncome = async (req, res, next) => {
	try {
		const { incomeId } = req.params
		const result = await deleteManualIncomeService(incomeId)

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
	createIncome,
	getIncomes,
	getIncomeSummary,
	updateIncome,
	deleteIncome,
}
