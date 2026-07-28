const mongoose = require('mongoose')

const trainerSchema = new mongoose.Schema(
	{
		trainerName: {
			type: String,
			required: [true, 'Trainer name is required'],
			trim: true,
			maxlength: [100, 'Trainer name cannot exceed 100 characters'],
		},
		phoneNumber: {
			type: String,
			required: [true, 'Phone number is required'],
			validate: {
				validator: (value) => /^[0-9]{10}$/.test(value),
				message: 'Phone number must be a valid 10-digit mobile number',
			},
		},
		place: {
			type: String,
			required: [true, 'Place is required'],
			trim: true,
			maxlength: [100, 'Place cannot exceed 100 characters'],
		},
		activeStatus: {
			type: String,
			required: [true, 'Active status is required'],
			enum: {
				values: ['Active', 'Inactive'],
				message: 'Active status must be Active or Inactive',
			},
			default: 'Active',
		},
	},
	{
		timestamps: true,
	}
)

const Trainer = mongoose.model('Trainer', trainerSchema)

module.exports = Trainer
