const express = require('express');
const router = express.Router();

// middlewares
const verifyToken = require('../middlewares/auth');

// controllers
const registerController = require('../controllers/RegisterController');
const loginController = require('../controllers/LoginController');
const checklistController = require('../controllers/ChecklistController');

// routes
router.post('/register', registerController.register);
router.post('/login', loginController.login);

router.post('/checklist', verifyToken, checklistController.createChecklist);
router.delete('/checklist/:id', verifyToken, checklistController.deleteChecklist);
router.get('/checklist', verifyToken, checklistController.getChecklists);
router.get('/checklist/:id', verifyToken, checklistController.getChecklistDetail);

router.post('/checklist/:id/items', verifyToken, checklistController.createTodoItem);
router.get('/checklist/:id/items', verifyToken, checklistController.getTodoItems);
router.put('/checklist/:id/items/:itemId', verifyToken, checklistController.updateTodoItem);
router.put('/checklist/:id/items/:itemId/status', verifyToken, checklistController.updateTodoItemStatus);
router.delete('/checklist/:id/items/:itemId', verifyToken, checklistController.deleteTodoItem);

module.exports = router;
