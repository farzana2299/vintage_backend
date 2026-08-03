const express = require('express')
const multer = require('multer')
const path = require('path')
const { jwtMiddleware } = require('../middleware/token')
const {
	createStudent,
	getStudents,
	getActiveStudents,
	getStudentById,
	updateStudent,
	deleteStudent,
} = require('../controllers/student.controller')

const router = express.Router()

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(process.cwd(), 'uploads', 'students'))
	},
	filename: (req, file, cb) => {
		const safeName = file.originalname.replace(/\s+/g, '_')
		cb(null, `${Date.now()}-${safeName}`)
	},
})

const imageFilter = (req, file, cb) => {
	const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
	if (!allowedTypes.includes(file.mimetype)) {
		return cb(new Error('Only JPG, JPEG and PNG files are allowed'))
	}
	cb(null, true)
}

const upload = multer({
	storage,
	fileFilter: imageFilter,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
})

router.post('/student', jwtMiddleware, upload.single('photo'), createStudent)
router.get('/students', jwtMiddleware, getStudents)
router.get('/students/active', jwtMiddleware, getActiveStudents)
router.get('/student/:studentId', jwtMiddleware, getStudentById)
router.patch('/student/:studentId', jwtMiddleware, upload.single('photo'), updateStudent)
router.delete('/student/:studentId', jwtMiddleware, deleteStudent)

module.exports = router
