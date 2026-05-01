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
        console.error('Cloudinary upload error details:', {
            message: error.message,
            name: error.name,
            http_code: error.http_code,
            code: error.code
        });
        
        // If upload fails, still try to delete local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
            console.log('Local file deleted after error:', localFilePath);
        }
        
        // Provide specific error messages for common issues
        let errorMessage = 'Failed to upload to Cloudinary';
        if (error.message.includes('Invalid Signature')) {
            errorMessage = 'Cloudinary authentication failed: Invalid API signature. Please check your Cloudinary credentials.';
        } else if (error.message.includes('Cloud name')) {
            errorMessage = 'Cloudinary configuration error: Invalid cloud name.';
        } else if (error.message.includes('API key')) {
            errorMessage = 'Cloudinary configuration error: Invalid API key.';
        } else if (error.http_code === 401) {
            errorMessage = 'Cloudinary authentication failed: Invalid credentials.';
        } else if (error.http_code === 400) {
            errorMessage = 'Cloudinary request error: Bad request.';
        }
        
        throw new Error(`${errorMessage}: ${error.message}`);
    }
};

module.exports = uploadToCloudinary;