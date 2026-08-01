const mongoose = require('mongoose')

const studentSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
			trim: true,
			maxlength: [100, 'Name cannot exceed 100 characters'],
		},
		gender: {
			type: String,
			required: [true, 'Gender is required'],
			enum: ['Male', 'Female', 'Other'],
		},
		place: {
			type: String,
			required: [true, 'Place is required'],
			trim: true,
			maxlength: [100, 'Place cannot exceed 100 characters'],
		},
		dateOfBirth: {
			type: Date,
			validate: {
				validator: (value) => !value || value <= new Date(),
				message: 'Date of birth cannot be a future date',
			},
		},
		mobileNumber: {
			type: String,
			required: [true, 'Mobile number is required'],
			validate: {
				validator: (value) => /^[0-9]{10}$/.test(value),
				message: 'Mobile number must be a valid 10-digit number',
			},
		},
		drivingLicenceNumber: {
			type: String,
			trim: true,
		},
		studentType: {
			type: String,
			enum: ['Driving Licence', 'Practice'],
		},
		photo: {
			type: String,
		},
		applicationNumber: {
			type: String,
			trim: true,
			unique: true,
			sparse: true,
		},
		address: {
			type: String,
			trim: true,
			maxlength: [500, 'Address cannot exceed 500 characters'],
		},
		learnersLicenceExpiryDate: {
			type: Date,
			validate: {
				validator: (value) => !value || value > new Date(),
				message: "Learner's licence expiry date must be greater than today's date",
			},
		},
		registrationPayment: {
			type: Number,
			min: [0, 'Registration payment must be greater than or equal to 0'],
		},
		amountPerClass: {
			type: Number,
			min: [0.01, 'Amount per class must be greater than 0'],
		},
		classOfVehicle: {
			type: String,
			enum: ['LMV', 'MCWG', 'LMV & MCWG'],
		},
		roadSafetyClassAttended: {
			type: String,
			enum: ['Yes', 'No'],
		},
		currentStatus: {
			type: String,
			enum: ['In Progress', 'Completed'],
		},
		practiceVehicleType: {
			type: String,
			enum: ['LMV', 'MCWG'],
		},
	},
	{
		timestamps: true,
	}
)

studentSchema.index({ name: 1 })
studentSchema.index({ mobileNumber: 1 })
studentSchema.index({ applicationNumber: 1 })
studentSchema.index({ drivingLicenceNumber: 1 })
studentSchema.index({ studentType: 1, currentStatus: 1 })

const Student = mongoose.model('Student', studentSchema)

module.exports = Student
