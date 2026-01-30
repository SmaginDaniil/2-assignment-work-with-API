const express = require('express');
const { User } = require('../models');
const verifyToken = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

const roles = require('../constants/roles');

router.put('/users/:id/role', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !roles.ALL.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or user.' });
    }

    if (req.user.id === id) {
      return res.status(403).json({ error: 'You cannot change your own role.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated successfully.', user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Update user role error:', err);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

module.exports = router;
