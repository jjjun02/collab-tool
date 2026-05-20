const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { register, login, logout, getMe, updateMe } = require('../controllers/auth.controller');

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', auth, logout);
router.get('/users/me', auth, getMe);
router.put('/users/me', auth, updateMe);

module.exports = router;