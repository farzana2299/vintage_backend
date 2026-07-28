const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')

const buildAdminToken = (admin) => {
	return jwt.sign(
		{ _id: admin._id, username: admin.username, type: admin.type },
		process.env.JWT_SECRET || 'superkey123',
		{ expiresIn: '1d' }
	)
}

const sanitizeAdminData = (admin) => {
	const adminData = admin.toObject()
	delete adminData.password
	return adminData
}

const adminRegisterService = async (username, password) => {
	const existingAdmin = await User.findOne({ username, type: 'admin' })

	if (existingAdmin) {
		return {
			status: false,
			statusCode: 409,
			message: 'Admin already exists with this username',
		}
	}

	const hashedPassword = await bcrypt.hash(password, 10)

	const admin = await User.create({
		username,
		password: hashedPassword,
		type: 'admin',
	})

	const token = buildAdminToken(admin)

	const adminData = sanitizeAdminData(admin)

	return {
		status: true,
		statusCode: 201,
		message: 'Admin registered successfully',
		data: {
			...adminData,
			token,
		},
	}
}

const adminLoginService = async (username, password) => {
	const admin = await User.findOne({ username, type: 'admin' })

	if (!admin) {
		return {
			status: false,
			statusCode: 404,
			message: 'No admin found',
		}
	}

	const isValidPassword = await bcrypt.compare(password, admin.password)

	if (!isValidPassword) {
		return {
			status: false,
			statusCode: 401,
			message: 'Invalid username or password',
		}
	}

	const token = buildAdminToken(admin)

	const adminData = sanitizeAdminData(admin)

	return {
		status: true,
		statusCode: 200,
		message: 'Login successfully',
		data: {
			...adminData,
			token,
		},
	}
}

const adminChangePasswordService = async (username, newPassword) => {
	const admin = await User.findOne({ username, type: 'admin' })

	if (!admin) {
		return {
			status: false,
			statusCode: 404,
			message: 'No admin found',
		}
	}

	const hashedPassword = await bcrypt.hash(newPassword, 10)
	admin.password = hashedPassword
	await admin.save()

	const token = buildAdminToken(admin)
	const adminData = sanitizeAdminData(admin)

	return {
		status: true,
		statusCode: 200,
		message: 'Password changed successfully',
		data: {
			...adminData,
			token,
		},
	}
}

module.exports = {
	adminRegisterService,
	adminLoginService,
	adminChangePasswordService,
}
