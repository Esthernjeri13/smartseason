const express = require('express');
const { getAgents, getUsers, getDashboardStats } = require('../controllers/usersController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/agents', requireAdmin, getAgents);
router.get('/', requireAdmin, getUsers);

module.exports = router;
