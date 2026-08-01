const {
	getTestsService,
	getStudentTestHistoryService,
	updateTestService,
} = require('../services/drivingTest.service')

const getTests = async (req, res, next) => {
	try {
		const {
			search = '',
			student = '',
			studentId = '',
			testName = '',
			testStatus = '',
			vehicleClass = '',
			testDate = '',
			startDate = '',
			endDate = '',
			page = 1,
			limit = 10,
			sortBy = '-createdAt',
		} = req.query

		const result = await getTestsService({
			search,
			student: student || studentId,
			testName,
			testStatus,
			vehicleClass,
			testDate,
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

const getStudentTestHistory = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const result = await getStudentTestHistoryService(studentId)

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

const updateTest = async (req, res, next) => {
	try {
		const { testId } = req.params
		const payload = { ...req.body }

		const result = await updateTestService(testId, payload)

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
	getTests,
	getStudentTestHistory,
	updateTest,
}
