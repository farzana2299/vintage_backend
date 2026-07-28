const Enquiry = require('../models/enquiry.model')

const createEnquiryService = async (enquiryData) => {
	const enquiry = await Enquiry.create(enquiryData)

	return {
		status: true,
		statusCode: 201,
		message: 'Enquiry created successfully',
		data: enquiry,
	}
}

const getEnquiriesService = async (filters = {}) => {
	const {
		search = '',
		enquiryType = '',
		startDate = '',
		endDate = '',
		sortBy = '-enquiryDate',
		page = 1,
		limit = 10,
	} = filters

	let query = {}

	// Search by name, phone, or place
	if (search) {
		query.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ phoneNumber: { $regex: search, $options: 'i' } },
			{ place: { $regex: search, $options: 'i' } },
		]
	}

	// Filter by enquiry type
	if (enquiryType) {
		query.enquiryType = enquiryType
	}

	// Filter by date range
	if (startDate || endDate) {
		query.enquiryDate = {}
		if (startDate) {
			query.enquiryDate.$gte = new Date(startDate)
		}
		if (endDate) {
			const end = new Date(endDate)
			end.setHours(23, 59, 59, 999)
			query.enquiryDate.$lte = end
		}
	}

	const skip = (parseInt(page) - 1) * parseInt(limit)

	const enquiries = await Enquiry.find(query)
		.sort(sortBy)
		.skip(skip)
		.limit(parseInt(limit))

	const total = await Enquiry.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Enquiries retrieved successfully',
		data: {
			enquiries,
			pagination: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				pages: Math.ceil(total / parseInt(limit)),
			},
		},
	}
}

const getEnquiryByIdService = async (enquiryId) => {
	const enquiry = await Enquiry.findById(enquiryId)

	if (!enquiry) {
		return {
			status: false,
			statusCode: 404,
			message: 'Enquiry not found',
		}
	}

	return {
		status: true,
		statusCode: 200,
		message: 'Enquiry retrieved successfully',
		data: enquiry,
	}
}

const updateEnquiryService = async (enquiryId, updateData) => {
	const enquiry = await Enquiry.findById(enquiryId)

	if (!enquiry) {
		return {
			status: false,
			statusCode: 404,
			message: 'Enquiry not found',
		}
	}

	// Validate enquiry date is not in future if being updated
	if (updateData.enquiryDate) {
		if (new Date(updateData.enquiryDate) > new Date()) {
			return {
				status: false,
				statusCode: 400,
				message: 'Enquiry date cannot be in the future',
			}
		}
	}

	const updatedEnquiry = await Enquiry.findByIdAndUpdate(
		enquiryId,
		updateData,
		{ new: true, runValidators: true }
	)

	return {
		status: true,
		statusCode: 200,
		message: 'Enquiry updated successfully',
		data: updatedEnquiry,
	}
}

const deleteEnquiryService = async (enquiryId) => {
	const enquiry = await Enquiry.findById(enquiryId)

	if (!enquiry) {
		return {
			status: false,
			statusCode: 404,
			message: 'Enquiry not found',
		}
	}

	await Enquiry.findByIdAndDelete(enquiryId)

	return {
		status: true,
		statusCode: 200,
		message: 'Enquiry deleted successfully',
		data: enquiry,
	}
}

module.exports = {
	createEnquiryService,
	getEnquiriesService,
	getEnquiryByIdService,
	updateEnquiryService,
	deleteEnquiryService,
}
