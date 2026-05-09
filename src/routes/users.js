const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { avatarUpload, handleUpload } = require('../middlewares/upload');
const { updateAvatar, getMe } = require('../controllers/userController');


router.use(auth);



router.get('/me', getMe);



router.put('/avatar', handleUpload(avatarUpload), updateAvatar);

module.exports = router;
