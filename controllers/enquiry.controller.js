const {
	createEnquiryService,
	getEnquiriesService,
	getEnquiryByIdService,
	updateEnquiryService,
	deleteEnquiryService,
} = require('../services/enquiry.service')

const createEnquiry = async (req, res, next) => {
	try {
		const { name, phoneNumber, place, enquiryType, description, enquiryDate } =
			req.body

		if (!name || !phoneNumber || !place || !enquiryType) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Please provide all required fields: name, phoneNumber, place, enquiryType',
			})
		}

		const result = await createEnquiryService({
			name,
			phoneNumber,
			place,
			enquiryType,
			description,
			enquiryDate: enquiryDate || new Date(),
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

const getEnquiries = async (req, res, next) => {
	try {
		const {
			search = '',
			enquiryType = '',
			startDate = '',
			endDate = '',
			sortBy = '-enquiryDate',
			page = 1,
			limit = 10,
		} = req.query

		const result = await getEnquiriesService({
			search,
			enquiryType,
			startDate,
			endDate,
			sortBy,
			page,
			limit,
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

const getEnquiryById = async (req, res, next) => {
	try {
		const { enquiryId } = req.params

		if (!enquiryId) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Enquiry ID is required',
			})
		}

		const result = await getEnquiryByIdService(enquiryId)

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

const updateEnquiry = async (req, res, next) => {
	try {
		const { enquiryId } = req.params
		const updateData = req.body

		if (!enquiryId) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Enquiry ID is required',
			})
		}

		const result = await updateEnquiryService(enquiryId, updateData)

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

const deleteEnquiry = async (req, res, next) => {
	try {
		const { enquiryId } = req.params

		if (!enquiryId) {
			return res.status(400).json({
				status: false,
				statusCode: 400,
				message: 'Enquiry ID is required',
			})
		}

		const result = await deleteEnquiryService(enquiryId)

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
	createEnquiry,
	getEnquiries,
	getEnquiryById,
	updateEnquiry,
	deleteEnquiry,
}
