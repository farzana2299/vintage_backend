const express = require('express')
const { jwtMiddleware } = require('../middleware/token')
const {
	createExpense,
	getExpenses,
	getExpenseSummary,
	updateExpense,
	deleteExpense,
} = require('../controllers/expense.controller')

const router = express.Router()

router.post('/expense', jwtMiddleware, createExpense)
router.get('/expenses', jwtMiddleware, getExpenses)
router.get('/expense/summary', jwtMiddleware, getExpenseSummary)
router.patch('/expense/:expenseId', jwtMiddleware, updateExpense)
router.delete('/expense/:expenseId', jwtMiddleware, deleteExpense)

module.exports = router
