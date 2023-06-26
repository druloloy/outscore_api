const router = require('express').Router();
const {
    adminAuth
} = require('../auth/auth');
const {
    signup,
    login,
    logout,
    uploadGrades,
    getGrades,
    addSubject,
    getSubjects,
    removeSubject,
    getStudents,
    bulkUploadGrades,
    updateStudent,
    removeStudent,
    purgeStudents,
    getStudent,
    searchStudent,
    bulkCreateStudentsAccount,
    updateGrades,
    updateStudentAccount,
    deactivateStudents,
    activateStudents,
    getActiveAdminSessions,
    deleteActiveAdminSession,
    changePassword,
    deleteAccount,
} = require('../controllers/admin.controller');
const multer = require('multer');

const upload = multer();


router.post('/accounts/signup', signup);
router.post('/accounts/login', login);



router.use(adminAuth);

router.put('/accounts/changePassword', changePassword);
router.post('/accounts/delete', deleteAccount);

router.delete('/accounts/logout', logout);
router.post('/grades/single', upload.single('file'), uploadGrades);
router.post('/grades/bulk', upload.array('files'), bulkUploadGrades);
router.get('/grades', getGrades);
router.put('/grades', updateGrades);

router.get('/student/all', getStudents);
router.get('/student/search', searchStudent);

router.post('/students', upload.single('file'), bulkCreateStudentsAccount)

router.get('/student', getStudent)
    .put('/student', updateStudent)
    .delete('/student', removeStudent)
    .purge('/student', purgeStudents)
    .put('/student/account', updateStudentAccount)

router.put('/students/account/deactivate', deactivateStudents)
    .put('/students/account/activate', activateStudents);

router.get('/subjects', getSubjects)
    .post('/subjects', addSubject)
    .delete('/subjects', removeSubject);

router.get('/session', getActiveAdminSessions)
.delete('/session', deleteActiveAdminSession);

module.exports = router;