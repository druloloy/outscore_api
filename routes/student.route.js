const { signup, login, logout, getGrades } = require('../controllers/student.controller');
const { studentAuth } = require('../auth/auth');
const router = require('express').Router();

router.post('/accounts/signup', signup);
router.post('/accounts/login', login);

router.use(studentAuth);
router.post('/accounts/logout', logout);
router.get('/grades/single', getGrades)

module.exports = router;