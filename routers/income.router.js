const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	createIncome,
	getIncomes,
	getIncomeSummary,
	updateIncome,
	deleteIncome,
} = require('../controllers/income.controller')

const router = express.Router()

router.post('/income', jwtMiddleware, createIncome)
router.get('/incomes', jwtMiddleware, getIncomes)
router.get('/income/summary', jwtMiddleware, getIncomeSummary)
router.patch('/income/:incomeId', jwtMiddleware, updateIncome)
router.delete('/income/:incomeId', jwtMiddleware, deleteIncome)

module.exports = router
