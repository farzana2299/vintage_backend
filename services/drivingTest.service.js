const DrivingTest = require('../models/drivingTest.model')
const Student = require('../models/student.model')

const testPlanByVehicleClass = {
	LMV: [
		{ testName: 'H Test', vehicleClass: 'LMV' },
		{ testName: 'Road Test', vehicleClass: 'LMV' },
	],
	MCWG: [
		{ testName: '8 Test', vehicleClass: 'MCWG' },
		{ testName: 'MCWG Road Test', vehicleClass: 'MCWG' },
	],
	'LMV & MCWG': [
		{ testName: 'H Test', vehicleClass: 'LMV' },
		{ testName: 'LMV Road Test', vehicleClass: 'LMV' },
		{ testName: '8 Test', vehicleClass: 'MCWG' },
		{ testName: 'MCWG Road Test', vehicleClass: 'MCWG' },
	],
}

const generateTestsForStudent = async (student) => {
	const testPlan = testPlanByVehicleClass[student.classOfVehicle]
	if (!testPlan) return []

	const existingTests = await DrivingTest.find({ student: student._id }).select('testName')
	const existingNames = new Set(existingTests.map((test) => test.testName))

	const testsToCreate = testPlan.filter((test) => !existingNames.has(test.testName))
	if (!testsToCreate.length) return []

	const created = await DrivingTest.insertMany(
		testsToCreate.map((test) => ({
			student: student._id,
			vehicleClass: test.vehicleClass,
			testName: test.testName,
			testStatus: 'Pending',
		}))
	)

	return created
}

const deleteTestsForStudent = async (studentId) => {
	await DrivingTest.deleteMany({ student: studentId })
}

const evaluateStudentCompletion = async (studentId) => {
	const tests = await DrivingTest.find({ student: studentId }).select('testStatus')
	if (!tests.length) return

	const allPassed = tests.every((test) => test.testStatus === 'Passed')
	const requiredStatus = allPassed ? 'Completed' : 'In Progress'

	await Student.updateOne(
		{ _id: studentId, currentStatus: { $ne: requiredStatus } },
		{ $set: { currentStatus: requiredStatus } }
	)
}

const getTestsSummaryListService = async () => {
	const summary = await DrivingTest.aggregate([
		{
			$group: {
				_id: '$student',
				pendingDates: {
					$push: {
						$cond: [
							{ $and: [{ $eq: ['$testStatus', 'Pending'] }, { $ne: ['$testDate', null] }] },
							'$testDate',
							'$$REMOVE',
						],
					},
				},
			},
		},
		{
			$addFields: {
				upcomingTestDate: { $min: '$pendingDates' },
			},
		},
		{
			$lookup: {
				from: 'students',
				localField: '_id',
				foreignField: '_id',
				as: 'student',
			},
		},
		{
			$unwind: '$student',
		},
		{
			$project: {
				_id: 0,
				studentId: '$student._id',
				studentName: '$student.name',
				vehicleClass: '$student.classOfVehicle',
				currentStatus: '$student.currentStatus',
				upcomingTestDate: { $ifNull: ['$upcomingTestDate', ''] },
			},
		},
		{
			$sort: { studentName: 1 },
		},
	])

	return {
		status: true,
		statusCode: 200,
		message: 'Driving test summary list fetched successfully',
		data: {
			summary,
		},
	}
}

const getStudentTestDetailService = async (studentId) => {
	const student = await Student.findById(studentId)
	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	const tests = await DrivingTest.find({ student: studentId }).sort({ testName: 1 })

	return {
		status: true,
		statusCode: 200,
		message: 'Student test detail fetched successfully',
		data: {
			studentDetails: {
				studentId: student._id,
				name: student.name,
				place: student.place,
				mobileNumber: student.mobileNumber,
				vehicleClass: student.classOfVehicle,
				currentStatus: student.currentStatus,
			},
			tests: tests.map((test) => ({
				testId: test._id,
				testName: test.testName,
				testDate: test.testDate,
				testStatus: test.testStatus,
				remarks: test.remarks,
			})),
		},
	}
}

const bulkScheduleTestsService = async (studentId, testDate) => {
	const student = await Student.findById(studentId)
	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	if (!testDate) {
		return {
			status: false,
			statusCode: 400,
			message: 'testDate is required',
		}
	}

	const scheduledDate = new Date(testDate)
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	if (scheduledDate < today) {
		return {
			status: false,
			statusCode: 400,
			message: 'Test date cannot be a past date',
		}
	}

	const updateResult = await DrivingTest.updateMany(
		{ student: studentId, testStatus: 'Pending', testDate: null },
		{ $set: { testDate: scheduledDate } }
	)

	const tests = await DrivingTest.find({ student: studentId }).sort({ testName: 1 })

	return {
		status: true,
		statusCode: 200,
		message: `Test date applied to ${updateResult.modifiedCount} pending test(s)`,
		data: {
			tests,
		},
	}
}

const recordTestResultService = async (testId, { testStatus, remarks }) => {
	const test = await DrivingTest.findById(testId)
	if (!test) {
		return {
			status: false,
			statusCode: 404,
			message: 'Driving test record not found',
		}
	}

	if (!testStatus || !['Passed', 'Failed'].includes(testStatus)) {
		return {
			status: false,
			statusCode: 400,
			message: 'testStatus must be Passed or Failed',
		}
	}

	if (test.testStatus === 'Passed') {
		return {
			status: false,
			statusCode: 400,
			message: 'This test has already been passed and cannot be updated',
		}
	}

	if (!test.testDate) {
		return {
			status: false,
			statusCode: 400,
			message: 'Cannot record a result before a test date is scheduled',
		}
	}

	test.history.push({
		testDate: test.testDate,
		testStatus,
		remarks,
		recordedAt: new Date(),
	})

	test.testStatus = testStatus
	test.remarks = remarks
	await test.save()

	await evaluateStudentCompletion(test.student)

	const updatedTest = await DrivingTest.findById(testId).populate(
		'student',
		'name mobileNumber currentStatus classOfVehicle'
	)

	return {
		status: true,
		statusCode: 200,
		message: 'Test result recorded successfully',
		data: updatedTest,
	}
}

const rescheduleTestService = async (testId, nextTestDate) => {
	const test = await DrivingTest.findById(testId)
	if (!test) {
		return {
			status: false,
			statusCode: 404,
			message: 'Driving test record not found',
		}
	}

	if (test.testStatus === 'Passed') {
		return {
			status: false,
			statusCode: 400,
			message: 'A passed test cannot be rescheduled',
		}
	}

	if (!nextTestDate) {
		return {
			status: false,
			statusCode: 400,
			message: 'nextTestDate is required',
		}
	}

	const newDate = new Date(nextTestDate)
	const today = new Date()
	today.setHours(0, 0, 0, 0)

	if (newDate < today) {
		return {
			status: false,
			statusCode: 400,
			message: 'Next test date cannot be a past date',
		}
	}

	test.testDate = newDate
	test.testStatus = 'Pending'
	test.remarks = undefined
	await test.save()

	await evaluateStudentCompletion(test.student)

	const updatedTest = await DrivingTest.findById(testId).populate(
		'student',
		'name mobileNumber currentStatus classOfVehicle'
	)

	return {
		status: true,
		statusCode: 200,
		message: 'Test rescheduled successfully',
		data: updatedTest,
	}
}

const getTestHistoryService = async (testId) => {
	const test = await DrivingTest.findById(testId).populate('student', 'name mobileNumber')
	if (!test) {
		return {
			status: false,
			statusCode: 404,
			message: 'Driving test record not found',
		}
	}

	const history = [...test.history].sort((a, b) => new Date(a.testDate) - new Date(b.testDate))

	return {
		status: true,
		statusCode: 200,
		message: 'Test history fetched successfully',
		data: {
			testId: test._id,
			testName: test.testName,
			student: test.student,
			history,
		},
	}
}

module.exports = {
	generateTestsForStudent,
	deleteTestsForStudent,
	getTestsSummaryListService,
	getStudentTestDetailService,
	bulkScheduleTestsService,
	recordTestResultService,
	rescheduleTestService,
	getTestHistoryService,
}
