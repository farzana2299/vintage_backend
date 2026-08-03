const mongoose = require('mongoose')

const incomeSchema = new mongoose.Schema(
	{
		incomeDate: {
			type: Date,
			required: [true, 'Income date is required'],
			validate: {
				validator: (value) => value <= new Date(),
				message: 'Income date cannot be a future date',
			},
		},
		incomeType: {
			type: String,
			required: [true, 'Income type is required'],
			enum: {
				values: ['Registration Fees', 'Class Fees', 'Test Fees', 'Others'],
				message: 'Income type must be Registration Fees, Class Fees, Test Fees or Others',
			},
		},
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [
				function () {
					return this.incomeType !== 'Others'
				},
				'Student is required for Registration Fees, Class Fees and Test Fees',
			],
		},
		amount: {
			type: Number,
			required: [true, 'Amount is required'],
			min: [0.01, 'Amount must be greater than 0'],
		},
		remarks: {
			type: String,
			trim: true,
			maxlength: [500, 'Remarks cannot exceed 500 characters'],
		},
		source: {
			type: String,
			required: true,
			enum: {
				values: ['Automatic', 'Manual'],
				message: 'Source must be Automatic or Manual',
			},
			default: 'Manual',
		},
		payment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Payment',
		},
	},
	{
		timestamps: true,
	}
)

incomeSchema.index({ student: 1 })
incomeSchema.index({ incomeType: 1 })
incomeSchema.index({ incomeDate: -1 })
incomeSchema.index({ source: 1 })
incomeSchema.index({ payment: 1 }, { unique: true, sparse: true })

const Income = mongoose.model('Income', incomeSchema)

module.exports = Income
