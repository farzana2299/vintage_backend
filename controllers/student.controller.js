const {
	createStudentService,
	getStudentsService,
	getStudentByIdService,
	updateStudentService,
	deleteStudentService,
	getActiveStudentsService,
} = require('../services/student.service')

const createStudent = async (req, res, next) => {
	try {
		const payload = { ...req.body }

		if (req.file) {
			payload.photo = req.file.path.replace(/\\/g, '/')
		}

		// Only these 4 fields are mandatory
		if (!payload.name || !payload.gender || !payload.place || !payload.mobileNumber) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide mandatory fields: name, gender, place, mobileNumber',
			})
		}

		const result = await createStudentService(payload)

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

const getStudents = async (req, res, next) => {
	try {
		const {
			search = '',
			studentType = '',
			currentStatus = '',
			page = 1,
			limit = 10,
			sortBy = '-createdAt',
		} = req.query

		const result = await getStudentsService({
			search,
			studentType,
			currentStatus,
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

const getStudentById = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const result = await getStudentByIdService(studentId)

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

const updateStudent = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const payload = { ...req.body }

		if (req.file) {
			payload.photo = req.file.path.replace(/\\/g, '/')
		}

		const result = await updateStudentService(studentId, payload)

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

const deleteStudent = async (req, res, next) => {
	try {
		const { studentId } = req.params
		const result = await deleteStudentService(studentId)

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

const getActiveStudents = async (req, res, next) => {
	try {
		const result = await getActiveStudentsService()

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
	createStudent,
	getStudents,
	getStudentById,
	updateStudent,
	deleteStudent,
	getActiveStudents,
}
