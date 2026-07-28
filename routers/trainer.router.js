const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	createTrainer,
	getTrainers,
	getActiveTrainers,
	getTrainerById,
	updateTrainer,
	deleteTrainer,
	toggleTrainerStatus,
} = require('../controllers/trainer.controller')

const router = express.Router()

router.post('/trainer', jwtMiddleware, createTrainer)
router.get('/trainers', jwtMiddleware, getTrainers)
router.get('/trainers/active', jwtMiddleware, getActiveTrainers)
router.get('/trainer/:trainerId', jwtMiddleware, getTrainerById)
router.patch('/trainer/:trainerId', jwtMiddleware, updateTrainer)
router.delete('/trainer/:trainerId', jwtMiddleware, deleteTrainer)
router.patch('/trainer/:trainerId/status', jwtMiddleware, toggleTrainerStatus)

module.exports = router
