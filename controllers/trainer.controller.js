const {
	createTrainerService,
	getTrainersService,
	getActiveTrainersService,
	getTrainerByIdService,
	updateTrainerService,
	deleteTrainerService,
	toggleTrainerStatusService,
} = require('../services/trainer.service')

const createTrainer = async (req, res, next) => {
	try {
		const { trainerName, phoneNumber, place, activeStatus } = req.body

		if (!trainerName || !phoneNumber || !place) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide trainerName, phoneNumber and place',
			})
		}

		const result = await createTrainerService({
			trainerName,
			phoneNumber,
			place,
			activeStatus: activeStatus || 'Active',
		})

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

const getTrainers = async (req, res, next) => {
	try {
		const { search = '', activeStatus = '', page = 1, limit = 10 } = req.query

		const result = await getTrainersService({ search, activeStatus, page, limit })

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

const getTrainerById = async (req, res, next) => {
	try {
		const { trainerId } = req.params
		const result = await getTrainerByIdService(trainerId)

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

const updateTrainer = async (req, res, next) => {
	try {
		const { trainerId } = req.params
		const result = await updateTrainerService(trainerId, req.body)

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

const deleteTrainer = async (req, res, next) => {
	try {
		const { trainerId } = req.params
		const result = await deleteTrainerService(trainerId)

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

const toggleTrainerStatus = async (req, res, next) => {
	try {
		const { trainerId } = req.params
		const { activeStatus } = req.body

		if (!activeStatus || !['Active', 'Inactive'].includes(activeStatus)) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'activeStatus must be Active or Inactive',
			})
		}

		const result = await toggleTrainerStatusService(trainerId, activeStatus)

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

const getActiveTrainers = async (req, res, next) => {
	try {
		const result = await getActiveTrainersService()

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
	createTrainer,
	getTrainers,
	getActiveTrainers,
	getTrainerById,
	updateTrainer,
	deleteTrainer,
	toggleTrainerStatus,
}
