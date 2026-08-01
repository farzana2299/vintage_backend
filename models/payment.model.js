const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [true, 'Student is required'],
		},
		paymentType: {
			type: String,
			required: [true, 'Payment type is required'],
			enum: {
				values: ['Registration', 'Class'],
				message: 'Payment type must be Registration or Class',
			},
		},
		classNumber: {
			type: Number,
			min: [1, 'Class number must be greater than 0'],
			required: [
				function () {
					return this.paymentType === 'Class'
				},
				'Class number is required when payment type is Class',
			],
		},
		amount: {
			type: Number,
			required: [true, 'Amount is required'],
			min: [0.01, 'Amount must be greater than 0'],
		},
		paymentDate: {
			type: Date,
			required: [true, 'Payment date is required'],
			validate: {
				validator: (value) => value <= new Date(),
				message: 'Payment date cannot be a future date',
			},
		},
	},
	{
		timestamps: true,
	}
)

paymentSchema.index({ student: 1 })
paymentSchema.index({ paymentType: 1 })
paymentSchema.index({ paymentDate: -1 })

const Payment = mongoose.model('Payment', paymentSchema)

module.exports = Payment
