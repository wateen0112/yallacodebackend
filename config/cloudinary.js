const cloudinary = require('cloudinary').v2;

const cloudinaryConfig = () => {
    console.log('Cloudinary config:');
    console.log('Cloud name:', process.env.CLOUD_NAME ? 'Set' : 'Not set');
    console.log('API key:', process.env.API_KEY ? 'Set' : 'Not set');
    console.log('API secret:', process.env.API_SECRET ? 'Set' : 'Not set');
    
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
    });
    
    // Verify configuration
    console.log('Cloudinary configured with cloud_name:', cloudinary.config().cloud_name);
};

// Test Cloudinary connection
const testCloudinaryConnection = async () => {
    try {
        const result = await cloudinary.api.ping();
        console.log('Cloudinary connection test successful:', result);
        return true;
    } catch (error) {
        console.error('Cloudinary connection test failed:', error.message);
        return false;
    }
};

module.exports = { cloudinaryConfig, cloudinary, testCloudinaryConnection };