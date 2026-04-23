const express = require('express');
const { authRequired } = require('../../middleware/auth');
const requireAdmin = require('../../middleware/requireAdmin');

const router = express.Router();
router.use(authRequired, requireAdmin);

router.use('/matches', require('./matches'));
router.use('/players', require('./players'));
router.use('/users', require('./users'));
router.use('/sync', require('./sync'));

module.exports = router;
