const mongoose = require('mongoose')

const attendanceSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [true, 'Student is required'],
		},
		classNumber: {
			type: Number,
			required: [true, 'Class number is required'],
			min: [1, 'Class number must be greater than 0'],
		},
		classDate: {
			type: Date,
			required: [true, 'Class date is required'],
			validate: {
				validator: (value) => value <= new Date(),
				message: 'Class date cannot be a future date',
			},
		},
		trainer: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Trainer',
			required: [true, 'Trainer is required'],
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

attendanceSchema.index({ student: 1, classNumber: 1 })
attendanceSchema.index({ classDate: -1 })
attendanceSchema.index({ trainer: 1 })

const Attendance = mongoose.model('Attendance', attendanceSchema)

module.exports = Attendance
