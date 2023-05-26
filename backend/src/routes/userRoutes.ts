import { Router } from 'express';
import { googleAuthentication, isAuthedUser, userLogin, userSignup, removeDriveFromAccount, getAppVersion, checkUserLtd } from '../controllers/userController';

const router = Router();

router.post('/app-version', getAppVersion);

router.post('/login', userLogin);
router.post('/signup', userSignup);

router.post('/auth/verify', isAuthedUser);
router.post('/auth/ltd', checkUserLtd);
router.post('/auth/google', googleAuthentication);
router.post('/auth/remove', removeDriveFromAccount);

export default router;
