const { getDashboardService } = require('../services/dashboard.service')

const getDashboard = async (req, res, next) => {
	try {
		const { fromDate = '', toDate = '', vehicleClass = '', testStatus = '' } = req.query

		const result = await getDashboardService({ fromDate, toDate, vehicleClass, testStatus })

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
	getDashboard,
}
