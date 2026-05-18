const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  createProject, getMyProjects, getProject,
  updateProject, deleteProject, refreshInviteCode,
  joinProject, getMembers
} = require('../controllers/project.controller');

router.use(auth);

router.post('/', createProject);
router.get('/', getMyProjects);
router.post('/join', joinProject);
router.get('/:projectId', getProject);
router.put('/:projectId', updateProject);
router.delete('/:projectId', deleteProject);
router.put('/:projectId/invite-code', refreshInviteCode);
router.get('/:projectId/members', getMembers);

module.exports = router;