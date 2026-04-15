const uploadToCloudinary = require('../utils/uploadToCloudinary');

// @desc    Upload image
// @route   POST /api/upload
// @access  Public
const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.path);

        res.status(200).json({
            success: true,
            data: {
                imageUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadImage
};