const {
	getTestsSummaryListService,
	getStudentTestDetailService,
	bulkScheduleTestsService,
	recordTestResultService,
	rescheduleTestService,
	getTestHistoryService,
} = require('../services/drivingTest.service')

const getTestsSummaryList = async (req, res, next) => {
	try {
		const result = await getTestsSummaryListService()

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

const getStudentTestDetail = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const result = await getStudentTestDetailService(studentId)

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

const bulkScheduleTests = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const { testDate } = req.body

		const result = await bulkScheduleTestsService(studentId, testDate)

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

const recordTestResult = async (req, res, next) => {
	try {
		const { testId } = req.params
		const { testStatus, remarks } = req.body

		const result = await recordTestResultService(testId, { testStatus, remarks })

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

const rescheduleTest = async (req, res, next) => {
	try {
		const { testId } = req.params
		const { nextTestDate, testDate } = req.body

		const result = await rescheduleTestService(testId, nextTestDate || testDate)

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

const getTestHistory = async (req, res, next) => {
	try {
		const { testId } = req.params
		const result = await getTestHistoryService(testId)

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

module.exports = {
	getTestsSummaryList,
	getStudentTestDetail,
	bulkScheduleTests,
	recordTestResult,
	rescheduleTest,
	getTestHistory,
}
