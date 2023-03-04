const { getStudentAccess, getAdminAccess } = require('../controllers/auth.controller');

const router = require('express').Router();

router.post('/refresh/student', getStudentAccess);
router.post('/refresh/admin', getAdminAccess);

module.exports = router;