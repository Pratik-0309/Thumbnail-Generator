import express from 'express'
import { userLogin, userLogout, userRegister, refreshAccessToken,getUserDetails } from '../controller/userController.js'
import verifyJWT from '../middleware/authmiddleware.js'

const router = express.Router();

router.post("/register",userRegister);
router.post("/login",userLogin);
router.post("/logout",userLogout);
router.post("/refresh-token",refreshAccessToken);
router.get("/profile",verifyJWT,getUserDetails);

export default router;
