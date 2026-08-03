const Student = require('../models/student.model')
const Trainer = require('../models/trainer.model')
const Enquiry = require('../models/enquiry.model')
const Payment = require('../models/payment.model')
const Income = require('../models/income.model')
const Expense = require('../models/expense.model')
const Attendance = require('../models/attendance.model')
const DrivingTest = require('../models/drivingTest.model')

const DAY_MS = 24 * 60 * 60 * 1000

const resolveDateRange = (fromDate, toDate) => {
	let start
	let end

	if (fromDate) {
		start = new Date(fromDate)
		start.setUTCHours(0, 0, 0, 0)
	} else {
		const now = new Date()
		start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
	}

	if (toDate) {
		end = new Date(toDate)
		end.setUTCHours(23, 59, 59, 999)
	} else {
		const now = new Date()
		end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
	}

	return { start, end }
}

const getFilteredStudentIds = async (vehicleClass) => {
	if (!vehicleClass) return null
	const students = await Student.find({ classOfVehicle: vehicleClass }).select('_id')
	return students.map((student) => student._id)
}

const buildStudentFilter = (vehicleClass) => (vehicleClass ? { classOfVehicle: vehicleClass } : {})

const getSummaryCards = async ({ start, end, studentIds, vehicleClass, financialSummary }) => {
	const totalStudents = await Student.countDocuments({})
	const activeStudents = await Student.countDocuments({ currentStatus: 'In Progress' })
	const completedStudents = await Student.countDocuments({ currentStatus: 'Completed' })

	const newEnquiries = await Enquiry.countDocuments({ enquiryDate: { $gte: start, $lte: end } })

	const upcomingTestFilter = {
		testStatus: 'Pending',
		testDate: { $gte: start, $lte: end },
	}
	if (studentIds) upcomingTestFilter.student = { $in: studentIds }
	const upcomingDrivingTests = await DrivingTest.countDocuments(upcomingTestFilter)

	const licenceExpiringFilter = {
		learnersLicenceExpiryDate: { $gte: start, $lte: end },
		...buildStudentFilter(vehicleClass),
	}
	const learnersLicenceExpiring = await Student.countDocuments(licenceExpiringFilter)

	return {
		totalStudents,
		activeStudents,
		completedStudents,
		newEnquiries,
		upcomingDrivingTests,
		learnersLicenceExpiring,
		totalIncome: financialSummary.totalIncome,
		totalExpense: financialSummary.totalExpense,
		netProfit: financialSummary.netProfit,
	}
}

const getUpcomingDrivingTests = async ({ start, end, studentIds, testStatus }) => {
	const query = {
		testDate: { $gte: start, $lte: end },
		testStatus: testStatus || 'Pending',
	}
	if (studentIds) query.student = { $in: studentIds }

	const tests = await DrivingTest.find(query)
		.populate('student', 'name classOfVehicle')
		.sort({ testDate: 1 })

	const list = tests
		.filter((test) => test.student)
		.map((test) => ({
			studentId: test.student._id,
			studentName: test.student.name,
			vehicleClass: test.student.classOfVehicle,
			testName: test.testName,
			testDate: test.testDate,
			attempt: test.history.length + 1,
			status: test.testStatus,
		}))

	return { count: list.length, list }
}

const getLearnersLicenceExpiry = async ({ start, end, vehicleClass }) => {
	const query = {
		learnersLicenceExpiryDate: { $gte: start, $lte: end },
		...buildStudentFilter(vehicleClass),
	}

	const students = await Student.find(query).sort({ learnersLicenceExpiryDate: 1 })

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	const list = students.map((student) => {
		const daysRemaining = Math.ceil((student.learnersLicenceExpiryDate - today) / DAY_MS)
		return {
			studentId: student._id,
			studentName: student.name,
			mobileNumber: student.mobileNumber,
			vehicleClass: student.classOfVehicle,
			learnersLicenceExpiryDate: student.learnersLicenceExpiryDate,
			daysRemaining,
			highlight: daysRemaining <= 30,
		}
	})

	return { count: list.length, list }
}

const getWarning1TestScheduledClassesNotCompleted = async ({ start, end, studentIds }) => {
	const query = { testDate: { $gte: start, $lte: end } }
	if (studentIds) query.student = { $in: studentIds }

	const tests = await DrivingTest.find(query).populate('student', 'name roadSafetyClassAttended')

	return tests
		.filter((test) => test.student && test.student.roadSafetyClassAttended !== 'Yes')
		.map((test) => ({
			studentId: test.student._id,
			studentName: test.student.name,
			testName: test.testName,
			testDate: test.testDate,
			roadSafetyClassAttended: test.student.roadSafetyClassAttended || 'No',
		}))
}

const getWarning2RoadSafetyClassPending = async ({ start, end, vehicleClass }) => {
	const pendingStudents = await Student.find({
		roadSafetyClassAttended: { $ne: 'Yes' },
		...buildStudentFilter(vehicleClass),
	}).select('_id name roadSafetyClassAttended')

	const pendingIds = pendingStudents.map((student) => student._id)
	if (!pendingIds.length) return []

	const tests = await DrivingTest.find({
		student: { $in: pendingIds },
		testDate: { $ne: null, $gte: start, $lte: end },
	}).populate('student', 'name roadSafetyClassAttended')

	return tests
		.filter((test) => test.student)
		.map((test) => ({
			studentId: test.student._id,
			studentName: test.student.name,
			testDate: test.testDate,
			roadSafetyClassAttended: test.student.roadSafetyClassAttended || 'No',
		}))
}

const getWarning3LearnersLicenceExpiringSoon = async ({ vehicleClass }) => {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	const in30Days = new Date(today.getTime() + 30 * DAY_MS)

	const students = await Student.find({
		learnersLicenceExpiryDate: { $gte: today, $lte: in30Days },
		...buildStudentFilter(vehicleClass),
	}).sort({ learnersLicenceExpiryDate: 1 })

	return students.map((student) => ({
		studentId: student._id,
		studentName: student.name,
		expiryDate: student.learnersLicenceExpiryDate,
		daysRemaining: Math.ceil((student.learnersLicenceExpiryDate - today) / DAY_MS),
	}))
}

const getWarning4FailedTestsAwaitingReschedule = async ({ studentIds }) => {
	const query = { testStatus: 'Failed' }
	if (studentIds) query.student = { $in: studentIds }

	const tests = await DrivingTest.find(query).populate('student', 'name classOfVehicle')

	return tests
		.filter((test) => test.student)
		.map((test) => ({
			studentId: test.student._id,
			studentName: test.student.name,
			vehicleClass: test.student.classOfVehicle,
			failedTest: test.testName,
			failedDate: test.testDate,
		}))
}

const getWarning5PendingRegistrationPayment = async ({ vehicleClass }) => {
	const registrationPayments = await Payment.aggregate([
		{ $match: { paymentType: 'Registration' } },
		{ $group: { _id: '$student', totalPaid: { $sum: '$amount' } } },
	])
	const paidMap = new Map(registrationPayments.map((entry) => [entry._id.toString(), entry.totalPaid]))

	const students = await Student.find({
		registrationPayment: { $gt: 0 },
		...buildStudentFilter(vehicleClass),
	})

	return students
		.filter((student) => (paidMap.get(student._id.toString()) || 0) < student.registrationPayment)
		.map((student) => ({
			studentId: student._id,
			studentName: student.name,
			vehicleClass: student.classOfVehicle,
			registrationFeeExpected: student.registrationPayment,
			registrationFeePaid: paidMap.get(student._id.toString()) || 0,
		}))
}

const getWarning6PendingClassFeePayment = async ({ vehicleClass }) => {
	const attendanceTotals = await Attendance.aggregate([
		{ $group: { _id: '$student', totalClassesAttended: { $sum: '$classNumber' } } },
	])
	const attendanceMap = new Map(
		attendanceTotals.map((entry) => [entry._id.toString(), entry.totalClassesAttended])
	)

	const attendedStudentIds = attendanceTotals.map((entry) => entry._id)
	if (!attendedStudentIds.length) return []

	const classPayments = await Payment.aggregate([
		{ $match: { paymentType: 'Class' } },
		{ $group: { _id: '$student', totalPaid: { $sum: '$amount' } } },
	])
	const classPaidMap = new Map(classPayments.map((entry) => [entry._id.toString(), entry.totalPaid]))

	const students = await Student.find({
		_id: { $in: attendedStudentIds },
		...buildStudentFilter(vehicleClass),
	})

	return students
		.map((student) => {
			const classesAttended = attendanceMap.get(student._id.toString()) || 0
			const expectedClassFee = (student.amountPerClass || 0) * classesAttended
			const paidClassFee = classPaidMap.get(student._id.toString()) || 0
			return { student, classesAttended, expectedClassFee, paidClassFee }
		})
		.filter((entry) => entry.expectedClassFee > entry.paidClassFee)
		.map((entry) => ({
			studentId: entry.student._id,
			studentName: entry.student.name,
			vehicleClass: entry.student.classOfVehicle,
			classesAttended: entry.classesAttended,
			expectedClassFee: entry.expectedClassFee,
			paidClassFee: entry.paidClassFee,
		}))
}

const getRecentStudentRegistrations = async ({ vehicleClass }) => {
	const students = await Student.find(buildStudentFilter(vehicleClass))
		.sort({ createdAt: -1 })
		.limit(10)

	return students.map((student) => ({
		studentId: student._id,
		studentName: student.name,
		mobileNumber: student.mobileNumber,
		vehicleClass: student.classOfVehicle,
		registrationDate: student.createdAt,
	}))
}

const getRecentEnquiries = async () => {
	const enquiries = await Enquiry.find({}).sort({ enquiryDate: -1 }).limit(10)

	return enquiries.map((enquiry) => ({
		name: enquiry.name,
		phone: enquiry.phoneNumber,
		place: enquiry.place,
		enquiryType: enquiry.enquiryType,
		date: enquiry.enquiryDate,
	}))
}

const getFinancialSummary = async ({ start, end }) => {
	const incomeByType = await Income.aggregate([
		{ $match: { incomeDate: { $gte: start, $lte: end } } },
		{ $group: { _id: '$incomeType', total: { $sum: '$amount' } } },
	])
	const incomeMap = Object.fromEntries(incomeByType.map((entry) => [entry._id, entry.total]))

	const expenseTotalResult = await Expense.aggregate([
		{ $match: { expenseDate: { $gte: start, $lte: end } } },
		{ $group: { _id: null, total: { $sum: '$amount' } } },
	])
	const totalExpense = expenseTotalResult[0]?.total || 0

	const registrationFeeIncome = incomeMap['Registration Fees'] || 0
	const classFeeIncome = incomeMap['Class Fees'] || 0
	const testFeeIncome = incomeMap['Test Fees'] || 0
	const otherIncome = incomeMap['Others'] || 0
	const totalIncome = registrationFeeIncome + classFeeIncome + testFeeIncome + otherIncome

	return {
		registrationFeeIncome,
		classFeeIncome,
		testFeeIncome,
		otherIncome,
		totalIncome,
		totalExpense,
		netProfit: totalIncome - totalExpense,
	}
}

const buildDailySeries = async ({ start, end }) => {
	const [dailyIncome, dailyExpense] = await Promise.all([
		Income.aggregate([
			{ $match: { incomeDate: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$incomeDate', timezone: 'UTC' } },
					total: { $sum: '$amount' },
				},
			},
		]),
		Expense.aggregate([
			{ $match: { expenseDate: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate', timezone: 'UTC' } },
					total: { $sum: '$amount' },
				},
			},
		]),
	])

	const incomeMap = new Map(dailyIncome.map((entry) => [entry._id, entry.total]))
	const expenseMap = new Map(dailyExpense.map((entry) => [entry._id, entry.total]))
	const allDates = new Set([...incomeMap.keys(), ...expenseMap.keys()])

	return [...allDates].sort().map((date) => ({
		date,
		income: incomeMap.get(date) || 0,
		expense: expenseMap.get(date) || 0,
	}))
}

const buildMonthlySeries = async ({ start, end }) => {
	const [monthlyIncome, monthlyExpense] = await Promise.all([
		Income.aggregate([
			{ $match: { incomeDate: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m', date: '$incomeDate', timezone: 'UTC' } },
					total: { $sum: '$amount' },
				},
			},
		]),
		Expense.aggregate([
			{ $match: { expenseDate: { $gte: start, $lte: end } } },
			{
				$group: {
					_id: { $dateToString: { format: '%Y-%m', date: '$expenseDate', timezone: 'UTC' } },
					total: { $sum: '$amount' },
				},
			},
		]),
	])

	const incomeMap = new Map(monthlyIncome.map((entry) => [entry._id, entry.total]))
	const expenseMap = new Map(monthlyExpense.map((entry) => [entry._id, entry.total]))
	const allMonths = new Set([...incomeMap.keys(), ...expenseMap.keys()])

	return [...allMonths].sort().map((month) => ({
		month,
		income: incomeMap.get(month) || 0,
		expense: expenseMap.get(month) || 0,
	}))
}

const getDrivingTestSummary = async ({ studentIds }) => {
	const baseQuery = studentIds ? { student: { $in: studentIds } } : {}

	const statusCounts = await DrivingTest.aggregate([
		{ $match: baseQuery },
		{ $group: { _id: '$testStatus', count: { $sum: 1 } } },
	])
	const statusMap = Object.fromEntries(statusCounts.map((entry) => [entry._id, entry.count]))

	const rescheduledTests = await DrivingTest.countDocuments({
		...baseQuery,
		testStatus: 'Pending',
		'history.0': { $exists: true },
	})

	return {
		pendingTests: statusMap['Pending'] || 0,
		passedTests: statusMap['Passed'] || 0,
		failedTests: statusMap['Failed'] || 0,
		rescheduledTests,
	}
}

const getAttendanceSummary = async ({ start, end, vehicleClass }) => {
	const classesConductedResult = await Attendance.aggregate([
		{ $match: { classDate: { $gte: start, $lte: end } } },
		{ $group: { _id: { classDate: '$classDate', trainer: '$trainer' } } },
		{ $count: 'count' },
	])
	const classesConducted = classesConductedResult[0]?.count || 0

	const totalAttendanceEntries = await Attendance.countDocuments({
		classDate: { $gte: start, $lte: end },
	})

	const studentsCompletedRequiredClasses = await Student.countDocuments({
		roadSafetyClassAttended: 'Yes',
		...buildStudentFilter(vehicleClass),
	})

	const studentsYetToCompleteClasses = await Student.countDocuments({
		roadSafetyClassAttended: { $ne: 'Yes' },
		...buildStudentFilter(vehicleClass),
	})

	return {
		classesConducted,
		totalAttendanceEntries,
		studentsCompletedRequiredClasses,
		studentsYetToCompleteClasses,
	}
}

const getTrainerSummary = async () => {
	const activeTrainers = await Trainer.countDocuments({ activeStatus: 'Active' })

	const now = new Date()
	const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
	const todayEnd = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
	)
	const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))
	const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))

	const classesConductedToday = await Attendance.countDocuments({
		classDate: { $gte: todayStart, $lte: todayEnd },
	})
	const classesConductedThisMonth = await Attendance.countDocuments({
		classDate: { $gte: monthStart, $lte: monthEnd },
	})

	return {
		activeTrainers,
		classesConductedToday,
		classesConductedThisMonth,
	}
}

const getDashboardService = async ({ fromDate = '', toDate = '', vehicleClass = '', testStatus = '' }) => {
	const { start, end } = resolveDateRange(fromDate, toDate)
	const studentIds = await getFilteredStudentIds(vehicleClass)

	const financialSummary = await getFinancialSummary({ start, end })

	const [
		summaryCards,
		upcomingDrivingTests,
		learnersLicenceExpiry,
		warning1,
		warning2,
		warning3,
		warning4,
		warning5,
		warning6,
		recentStudentRegistrations,
		recentEnquiries,
		dailyIncomeVsExpense,
		monthlyIncomeVsExpense,
		drivingTestSummary,
		attendanceSummary,
		trainerSummary,
	] = await Promise.all([
		getSummaryCards({ start, end, studentIds, vehicleClass, financialSummary }),
		getUpcomingDrivingTests({ start, end, studentIds, testStatus }),
		getLearnersLicenceExpiry({ start, end, vehicleClass }),
		getWarning1TestScheduledClassesNotCompleted({ start, end, studentIds }),
		getWarning2RoadSafetyClassPending({ start, end, vehicleClass }),
		getWarning3LearnersLicenceExpiringSoon({ vehicleClass }),
		getWarning4FailedTestsAwaitingReschedule({ studentIds }),
		getWarning5PendingRegistrationPayment({ vehicleClass }),
		getWarning6PendingClassFeePayment({ vehicleClass }),
		getRecentStudentRegistrations({ vehicleClass }),
		getRecentEnquiries(),
		buildDailySeries({ start, end }),
		buildMonthlySeries({ start, end }),
		getDrivingTestSummary({ studentIds }),
		getAttendanceSummary({ start, end, vehicleClass }),
		getTrainerSummary(),
	])

	return {
		status: true,
		statusCode: 200,
		message: 'Dashboard data fetched successfully',
		data: {
			filters: {
				fromDate: start,
				toDate: end,
				vehicleClass: vehicleClass || null,
				testStatus: testStatus || null,
			},
			summaryCards,
			upcomingDrivingTests,
			learnersLicenceExpiry,
			warnings: {
				testScheduledButClassesNotCompleted: { priority: 'High', list: warning1 },
				roadSafetyClassPending: { priority: 'High', list: warning2 },
				learnersLicenceExpiringSoon: { priority: 'Medium', list: warning3 },
				failedTestsAwaitingReschedule: { priority: 'High', list: warning4 },
				pendingRegistrationPayment: { priority: 'High', list: warning5 },
				pendingClassFeePayment: { priority: 'High', list: warning6 },
			},
			recentStudentRegistrations,
			recentEnquiries,
			financialSummary,
			incomeVsExpense: {
				daily: dailyIncomeVsExpense,
				monthly: monthlyIncomeVsExpense,
			},
			drivingTestSummary,
			attendanceSummary,
			trainerSummary,
		},
	}
}

module.exports = {
	getDashboardService,
}
