const mongoose = require('mongoose')

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
				values: ['H Test', 'Road Test', '8 Test', 'LMV Road Test', 'MCWG Road Test'],
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
		nextTestDate: {
			type: Date,
			required: [
				function () {
					return this.testStatus === 'Failed'
				},
				'Next test date is required when test status is Failed',
			],
		},
	},
	{
		timestamps: true,
	}
)

drivingTestSchema.index({ student: 1, testName: 1 }, { unique: true })
drivingTestSchema.index({ testStatus: 1 })
drivingTestSchema.index({ testDate: -1 })
drivingTestSchema.index({ vehicleClass: 1 })

const DrivingTest = mongoose.model('DrivingTest', drivingTestSchema)

module.exports = DrivingTest
