const Trainer = require('../models/trainer.model')

const createTrainerService = async (trainerData) => {
	const trainer = await Trainer.create(trainerData)

	return {
		status: true,
		statusCode: 201,
		message: 'Trainer created successfully',
		data: trainer,
	}
}

const getTrainersService = async ({ search = '', activeStatus = '', page = 1, limit = 10 }) => {
	const query = {}

	if (search) {
		query.$or = [
			{ trainerName: { $regex: search, $options: 'i' } },
			{ phoneNumber: { $regex: search, $options: 'i' } },
			{ place: { $regex: search, $options: 'i' } },
		]
	}

	if (activeStatus) {
		query.activeStatus = activeStatus
	}

	const pageNumber = parseInt(page, 10)
	const limitNumber = parseInt(limit, 10)
	const skip = (pageNumber - 1) * limitNumber

	const trainers = await Trainer.find(query)
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(limitNumber)

	const total = await Trainer.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Trainers fetched successfully',
		data: {
			trainers,
			pagination: {
				total,
				page: pageNumber,
				limit: limitNumber,
				totalPages: Math.ceil(total / limitNumber),
			},
		},
	}
}

const getTrainerByIdService = async (trainerId) => {
	const trainer = await Trainer.findById(trainerId)

	if (!trainer) {
		return {
			status: false,
			statusCode: 404,
			message: 'Trainer not found',
		}
	}

	return {
		status: true,
		statusCode: 200,
		message: 'Trainer fetched successfully',
		data: trainer,
	}
}

const updateTrainerService = async (trainerId, payload) => {
	const trainer = await Trainer.findById(trainerId)

	if (!trainer) {
		return {
			status: false,
			statusCode: 404,
			message: 'Trainer not found',
		}
	}

	const updatedTrainer = await Trainer.findByIdAndUpdate(trainerId, payload, {
		new: true,
		runValidators: true,
	})

	return {
		status: true,
		statusCode: 200,
		message: 'Trainer updated successfully',
		data: updatedTrainer,
	}
}

const deleteTrainerService = async (trainerId) => {
	const trainer = await Trainer.findById(trainerId)

	if (!trainer) {
		return {
			status: false,
			statusCode: 404,
			message: 'Trainer not found',
		}
	}

	await Trainer.findByIdAndDelete(trainerId)

	return {
		status: true,
		statusCode: 200,
		message: 'Trainer deleted successfully',
		data: trainer,
	}
}

const toggleTrainerStatusService = async (trainerId, activeStatus) => {
	const trainer = await Trainer.findById(trainerId)

	if (!trainer) {
		return {
			status: false,
			statusCode: 404,
			message: 'Trainer not found',
		}
	}

	trainer.activeStatus = activeStatus
	await trainer.save()

	return {
		status: true,
		statusCode: 200,
		message: 'Trainer status updated successfully',
		data: trainer,
	}
}

const getActiveTrainersService = async () => {
	const trainers = await Trainer.find({ activeStatus: 'Active' }).sort({ createdAt: -1 })

	return {
		status: true,
		statusCode: 200,
		message: 'Active trainers fetched successfully',
		data: {
			trainers,
		},
	}
}

module.exports = {
	createTrainerService,
	getTrainersService,
	getTrainerByIdService,
	updateTrainerService,
	deleteTrainerService,
	toggleTrainerStatusService,
	getActiveTrainersService,
}
