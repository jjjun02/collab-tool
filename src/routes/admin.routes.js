const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { getLogs } = require('../controllers/admin.controller');

router.get('/logs', auth, getLogs);

module.exports = router;