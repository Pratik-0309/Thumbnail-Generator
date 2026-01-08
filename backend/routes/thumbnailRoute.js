import express from 'express'
import { generateThumbnail, deleteThumbnail } from '../controller/thumbnailController.js'
import verifyJWT from '../middleware/authmiddleware.js'

const router = express.Router();

router.post('/generate',verifyJWT, generateThumbnail);
router.delete('/delete/:id',verifyJWT, deleteThumbnail);

export default router;
