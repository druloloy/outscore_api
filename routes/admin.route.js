const router = require('express').Router();
const {adminAuth} = require('../auth/auth');
const { signup, login, logout, uploadGrades, getGrades, addSubject, getSubjects, removeSubject } = require('../controllers/admin.controller');
const multer = require('multer');

const upload = multer();


router.post('/accounts/signup', signup);
router.post('/accounts/login', login);

router.use(adminAuth);
router.delete('/accounts/logout', logout);
router.post('/grades/single', upload.single('file'), uploadGrades);
router.get('/grades', getGrades);

router.get('/subjects', getSubjects);
router.post('/subjects', addSubject);
router.delete('/subjects', removeSubject);


module.exports = router;
