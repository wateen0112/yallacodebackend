const express = require('express');
const router = express.Router();

const { uploadImage } = require('../controllers/uploadController');
const upload = require('../middlewares/uploadMiddleware');

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload image to Cloudinary
 *     description: Upload an image file to Cloudinary and get the secure URL
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 2MB, image types only)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Bad request (invalid file type/size)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', upload.single('image'), uploadImage);

module.exports = router;