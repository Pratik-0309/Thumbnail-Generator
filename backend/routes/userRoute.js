import express from 'express'
import { userLogin, userLogout, userRegister, refreshAccessToken } from '../controller/userController.js'

const router = express.Router();

router.post("/register",userRegister);
router.post("/login",userLogin);
router.post("/logout",userLogout);
router.post("/refresh-token",refreshAccessToken);

export default router;
