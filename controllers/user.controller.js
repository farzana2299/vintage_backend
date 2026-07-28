const {
	adminLoginService,
	adminRegisterService,
	adminChangePasswordService,
} = require('../services/user.service')

const adminRegister = async (req, res, next) => {
	try {
		const { username, password } = req.body

		if (!username || !password) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide username and password',
			})
		}

		const result = await adminRegisterService(username, password)

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

const adminLogin = async (req, res, next) => {
	try {
		const { username, password } = req.body

		if (!username || !password) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide username and password',
			})
		}

		const result = await adminLoginService(username, password)

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

const adminChangePassword = async (req, res, next) => {
	try {
		const { username, newPassword } = req.body

		if (!username || !newPassword) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide username and newPassword',
			})
		}

		const result = await adminChangePasswordService(username, newPassword)

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
	adminRegister,
	adminLogin,
	adminChangePassword,
}
