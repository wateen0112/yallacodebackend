const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (localFilePath) => {
    try {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'projects', // Optional: organize in a folder
        });

        // Delete local file after upload
        fs.unlinkSync(localFilePath);

        // Return the secure URL
        return result.secure_url;
    } catch (error) {
        // If upload fails, still try to delete local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
};

module.exports = uploadToCloudinary;