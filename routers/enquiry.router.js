const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	createEnquiry,
	getEnquiries,
	getEnquiryById,
	updateEnquiry,
	deleteEnquiry,
} = require('../controllers/enquiry.controller')

const router = express.Router()

// Apply JWT middleware to all enquiry routes
router.post('/enquiry', jwtMiddleware, createEnquiry)
router.get('/enquiries', jwtMiddleware, getEnquiries)
router.get('/enquiry/:enquiryId', jwtMiddleware, getEnquiryById)
router.patch('/enquiry/:enquiryId', jwtMiddleware, updateEnquiry)
router.delete('/enquiry/:enquiryId', jwtMiddleware, deleteEnquiry)

module.exports = router
