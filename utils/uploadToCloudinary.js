const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

const uploadToCloudinary = async (localFilePath) => {
    try {
        console.log('Starting Cloudinary upload for:', localFilePath);
        
        // Check if file exists before uploading
        if (!fs.existsSync(localFilePath)) {
            throw new Error(`File not found: ${localFilePath}`);
        }
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: 'projects', // Optional: organize in a folder
        });

        console.log('Cloudinary upload successful:', result.secure_url);

        // Delete local file after upload
        fs.unlinkSync(localFilePath);
        console.log('Local file deleted:', localFilePath);

        // Return the secure URL
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        
        // If upload fails, still try to delete local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log('Local file deleted after error:', localFilePath);
        }
        
        throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
    }
};

module.exports = uploadToCloudinary;