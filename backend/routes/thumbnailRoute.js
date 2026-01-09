import express from 'express'
import { generateThumbnail, deleteThumbnail, getUserThumnail, getSingleThumbnail } from '../controller/thumbnailController.js'
import verifyJWT from '../middleware/authmiddleware.js'

const router = express.Router();

router.post('/generate',verifyJWT, generateThumbnail);
router.delete('/delete/:id',verifyJWT, deleteThumbnail);
router.get('/thumbnails',verifyJWT,getUserThumnail);
router.get('/thumbnail/:id',verifyJWT,getSingleThumbnail);

export default router;
