const { signup, login, logout, getGrades, getProfile, updateProfile,updateProfilePicture } = require('../controllers/student.controller');

const multer = require('multer');
const { studentAuth } = require('../auth/auth');
const router = require('express').Router();
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'storage/profiles/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    }
  })

const upload = multer({storage});


router.post('/accounts/signup', signup);
router.post('/accounts/login', login);


router.use(studentAuth);
router.get('/profile', getProfile)
.put('/ profile', updateProfile)
.put('/profile/picture', upload.single('profile'), updateProfilePicture)

router.post('/accounts/logout', logout);
router.get('/grades/single', getGrades)

module.exports = router;