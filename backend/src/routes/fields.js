const express = require('express');
const {
  getAllFields, getMyFields, getField,
  createField, updateField, deleteField, addFieldUpdate
} = require('../controllers/fieldsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin: all fields; Agent: redirected to /my
router.get('/', (req, res, next) => {
  if (req.user.role === 'admin') return getAllFields(req, res, next);
  return getMyFields(req, res, next);
});

router.get('/my', getMyFields);
router.get('/:id', getField);

// Admin only
router.post('/', requireAdmin, createField);
router.put('/:id', requireAdmin, updateField);
router.delete('/:id', requireAdmin, deleteField);

// Agents and admins can add updates
router.post('/:id/updates', addFieldUpdate);

module.exports = router;
