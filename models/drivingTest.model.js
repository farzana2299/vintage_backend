const mongoose = require('mongoose')

const testHistorySchema = new mongoose.Schema(
	{
		testDate: {
			type: Date,
		},
		testStatus: {
			type: String,
			required: [true, 'Test status is required'],
			enum: {
				values: ['Passed', 'Failed'],
				message: 'History entry status must be Passed or Failed',
			},
		},
		remarks: {
			type: String,
			trim: true,
			maxlength: [500, 'Remarks cannot exceed 500 characters'],
		},
		recordedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: false }
)

const drivingTestSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [true, 'Student is required'],
		},
		vehicleClass: {
			type: String,
			required: [true, 'Vehicle class is required'],
			enum: {
				values: ['LMV', 'MCWG'],
				message: 'Vehicle class must be LMV or MCWG',
			},
		},
		testName: {
			type: String,
			required: [true, 'Test name is required'],
			enum: {
				values: ['H Test', 'Road Test', 'LMV Road Test', '8 Test', 'MCWG Road Test'],
				message: 'Invalid test name',
			},
		},
		testDate: {
			type: Date,
		},
		testStatus: {
			type: String,
			required: [true, 'Test status is required'],
			enum: {
				values: ['Pending', 'Passed', 'Failed'],
				message: 'Test status must be Pending, Passed or Failed',
			},
			default: 'Pending',
		},
		remarks: {
			type: String,
			trim: true,
			maxlength: [500, 'Remarks cannot exceed 500 characters'],
		},
		history: [testHistorySchema],
	},
	{
		timestamps: true,
	}
)

drivingTestSchema.index({ student: 1, testName: 1 }, { unique: true })
drivingTestSchema.index({ testStatus: 1 })
drivingTestSchema.index({ testDate: 1 })

const DrivingTest = mongoose.model('DrivingTest', drivingTestSchema)

module.exports = DrivingTest
