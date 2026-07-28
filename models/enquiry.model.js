const mongoose = require('mongoose')

const enquirySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			maxlength: [100, 'Name cannot exceed 100 characters'],
			trim: true,
		},
		phoneNumber: {
			type: String,
			required: [true, 'Phone number is required'],
			validate: {
				validator: (v) => /^[0-9]{10}$/.test(v),
				message: 'Phone number must be a valid 10-digit number',
			},
		},
		place: {
			type: String,
			required: [true, 'Place is required'],
			trim: true,
		},
		enquiryType: {
			type: String,
			enum: {
				values: ['Licence', 'Practice'],
				message: 'Enquiry type must be either Licence or Practice',
			},
			required: [true, 'Enquiry type is required'],
		},
		description: {
			type: String,
			maxlength: [500, 'Description cannot exceed 500 characters'],
			trim: true,
		},
		enquiryDate: {
			type: Date,
			required: [true, 'Enquiry date is required'],
			default: () => new Date(),
			validate: {
				validator: (v) => v <= new Date(),
				message: 'Enquiry date cannot be in the future',
			},
		},
	},
	{
		timestamps: true,
	}
)

const Enquiry = mongoose.model('Enquiry', enquirySchema)

module.exports = Enquiry
