const DrivingTest = require('../models/drivingTest.model')
const Student = require('../models/student.model')

const testPlanByVehicleClass = {
	LMV: [
		{ testName: 'H Test', vehicleClass: 'LMV' },
		{ testName: 'Road Test', vehicleClass: 'LMV' },
	],
	MCWG: [
		{ testName: '8 Test', vehicleClass: 'MCWG' },
		{ testName: 'Road Test', vehicleClass: 'MCWG' },
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

	const tests = await DrivingTest.insertMany(
		testPlan.map((test) => ({
			student: student._id,
			vehicleClass: test.vehicleClass,
			testName: test.testName,
			testStatus: 'Pending',
		}))
	)

	return tests
}

const getTestsService = async ({
	search = '',
	student = '',
	testName = '',
	testStatus = '',
	vehicleClass = '',
	testDate = '',
	startDate = '',
	endDate = '',
	page = 1,
	limit = 10,
	sortBy = '-createdAt',
}) => {
	const query = {}

	if (student) {
		query.student = student
	}

	if (testName) {
		query.testName = testName
	}

	if (testStatus) {
		query.testStatus = testStatus
	}

	if (vehicleClass) {
		query.vehicleClass = vehicleClass
	}

	if (testDate) {
		const start = new Date(testDate)
		start.setUTCHours(0, 0, 0, 0)
		const end = new Date(testDate)
		end.setUTCHours(23, 59, 59, 999)
		query.testDate = { $gte: start, $lte: end }
	} else if (startDate || endDate) {
		query.testDate = {}
		if (startDate) {
			const start = new Date(startDate)
			start.setUTCHours(0, 0, 0, 0)
			query.testDate.$gte = start
		}
		if (endDate) {
			const end = new Date(endDate)
			end.setUTCHours(23, 59, 59, 999)
			query.testDate.$lte = end
		}
	}

	if (search) {
		const searchRegex = new RegExp(search, 'i')
		const studentMatches = await Student.find({ name: searchRegex }).select('_id')
		query.student = { $in: studentMatches.map((item) => item._id) }
	}

	const pageNumber = parseInt(page, 10)
	const limitNumber = parseInt(limit, 10)
	const skip = (pageNumber - 1) * limitNumber

	const tests = await DrivingTest.find(query)
		.populate('student', 'name mobileNumber currentStatus classOfVehicle')
		.sort(sortBy)
		.skip(skip)
		.limit(limitNumber)

	const total = await DrivingTest.countDocuments(query)

	return {
		status: true,
		statusCode: 200,
		message: 'Driving test list fetched successfully',
		data: {
			tests,
			pagination: {
				total,
				page: pageNumber,
				limit: limitNumber,
				totalPages: Math.ceil(total / limitNumber),
			},
		},
	}
}

const getStudentTestHistoryService = async (studentId) => {
	const student = await Student.findById(studentId)
	if (!student) {
		return {
			status: false,
			statusCode: 404,
			message: 'Student not found',
		}
	}

	const tests = await DrivingTest.find({ student: studentId }).sort({ createdAt: 1 })

	const studentDetails = {
		studentId: student._id,
		name: student.name,
		phoneNumber: student.mobileNumber,
		place: student.place,
		classOfVehicle: student.classOfVehicle,
	}

	return {
		status: true,
		statusCode: 200,
		message: 'Student test history fetched successfully',
		data: {
			studentDetails,
			tests,
		},
	}
}

const updateTestService = async (testId, payload) => {
	const test = await DrivingTest.findById(testId)
	if (!test) {
		return {
			status: false,
			statusCode: 404,
			message: 'Driving test record not found',
		}
	}

	if (payload.testDate) {
		const scheduledDate = new Date(payload.testDate)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		if (scheduledDate < today) {
			return {
				status: false,
				statusCode: 400,
				message: 'Test date cannot be a past date while scheduling',
			}
		}
	}

	const updatedTestStatus = payload.testStatus || test.testStatus
	const updatedNextTestDate =
		payload.nextTestDate !== undefined ? payload.nextTestDate : test.nextTestDate

	if (updatedTestStatus === 'Failed' && !updatedNextTestDate) {
		return {
			status: false,
			statusCode: 400,
			message: 'Next test date is required when test status is Failed',
		}
	}

	if (updatedTestStatus === 'Failed') {
		const nextDate = new Date(updatedNextTestDate)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		if (nextDate < today) {
			return {
				status: false,
				statusCode: 400,
				message: 'Next test date cannot be a past date',
			}
		}
	}

	if (updatedTestStatus !== 'Failed') {
		test.nextTestDate = undefined
	}

	Object.assign(test, payload)
	await test.save()

	const updatedTest = await DrivingTest.findById(testId).populate(
		'student',
		'name mobileNumber currentStatus classOfVehicle'
	)

	return {
		status: true,
		statusCode: 200,
		message: 'Driving test updated successfully',
		data: updatedTest,
	}
}

module.exports = {
	generateTestsForStudent,
	getTestsService,
	getStudentTestHistoryService,
	updateTestService,
}
