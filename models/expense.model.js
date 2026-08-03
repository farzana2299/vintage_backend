const mongoose = require('mongoose')

const expenseSchema = new mongoose.Schema(
	{
		expenseDate: {
			type: Date,
			required: [true, 'Expense date is required'],
			validate: {
				validator: (value) => value <= new Date(),
				message: 'Expense date cannot be a future date',
			},
		},
		expenseType: {
			type: String,
			required: [true, 'Expense type is required'],
			enum: {
				values: ['Staff Salary', 'Rent', 'Petrol', 'CNG', 'RTO Fees','Others'],
				message: 'Expense type must be Staff Salary, Rent, Petrol, CNG, RTO Fees or Others',
			},
		},
		staff: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Trainer',
			required: [
				function () {
					return this.expenseType === 'Staff Salary'
				},
				'Staff name is required when expense type is Staff Salary',
			],
		},
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [
				function () {
					return this.expenseType === 'RTO Fees'
				},
				'Student is required when expense type is RTO Fees',
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
	},
	{
		timestamps: true,
	}
)

expenseSchema.index({ staff: 1 })
expenseSchema.index({ student: 1 })
expenseSchema.index({ expenseType: 1 })
expenseSchema.index({ expenseDate: -1 })

const Expense = mongoose.model('Expense', expenseSchema)

module.exports = Expense
