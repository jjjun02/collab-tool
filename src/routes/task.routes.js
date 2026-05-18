const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middlewares/auth');
const {
  createTask, getTasks, getTask,
  updateTask, updateTaskStatus, deleteTask
} = require('../controllers/task.controller');

router.use(auth);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/:taskId', getTask);
router.put('/:taskId', updateTask);
router.patch('/:taskId/status', updateTaskStatus);
router.delete('/:taskId', deleteTask);

module.exports = router;