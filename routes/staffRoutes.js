// routes/staffRoutes.js
const express = require('express');
const { getStaff, getStaffById, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, allowRoles('admin')); // the whole staff module is admin-only

router.get('/', getStaff);
router.get('/:id', getStaffById);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
