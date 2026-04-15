# YallaCode Backend

A production-ready backend for a software company website built with Node.js, Express.js, MongoDB Atlas, and Cloudinary.

## Features

- **Projects Portfolio**: CRUD operations for project showcase
- **Customer Reviews**: Collect and display customer feedback
- **Image Upload System**: Secure image uploads to Cloudinary
- **MVC Architecture**: Clean, maintainable code structure
- **Rate Limiting**: Protection against abuse (5 req/min per IP)
- **Error Handling**: Unified error response format
- **Input Validation**: Mongoose validation for data integrity

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **Cloudinary** - Image hosting and management
- **Multer** - File upload handling
- **JWT** - Authentication (if needed)
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Express Rate Limit** - API rate limiting

## Project Structure

```
project/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── cloudinary.js         # Cloudinary configuration
├── models/
│   ├── Project.js            # Project schema
│   └── Review.js             # Review schema
├── controllers/
│   ├── projectController.js  # Project business logic
│   ├── reviewController.js   # Review business logic
│   └── uploadController.js   # Image upload logic
├── routes/
│   ├── projectRoutes.js      # Project API routes
│   ├── reviewRoutes.js       # Review API routes
│   └── uploadRoutes.js       # Upload API routes
├── middlewares/
│   ├── errorMiddleware.js    # Error handling
│   ├── rateLimiter.js        # Rate limiting
│   └── uploadMiddleware.js   # File upload config
├── utils/
│   └── uploadToCloudinary.js # Cloudinary upload utility
├── uploads/                  # Temporary file storage
├── server.js                 # Application entry point
├── .env                      # Environment variables
└── package.json              # Dependencies
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_atlas_connection_string
   CLOUD_NAME=your_cloudinary_cloud_name
   API_KEY=your_cloudinary_api_key
   API_SECRET=your_cloudinary_api_secret
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. For production:
   ```bash
   npm start
   ```

## API Documentation

The API documentation is available via Swagger UI at `/api-docs` when the server is running.

Visit `http://localhost:5000/api-docs` to explore and test all API endpoints interactively.

## API Endpoints

### Projects

- `GET /api/projects` - Get all projects (with pagination, search, sort)
  - Query params: `page`, `limit`, `search`, `sort`
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project

### Reviews

- `GET /api/reviews` - Get all reviews
- `POST /api/reviews` - Create or update review (by email)
- `GET /api/reviews/stats` - Get review statistics

### Upload

- `POST /api/upload` - Upload image to Cloudinary

### Health Check

- `GET /api/health` - Server health check

## Image Upload Flow

The image upload system follows this flow:

1. **Frontend uploads image** to `/api/upload` as form-data
2. **Backend stores temporarily** in `/uploads` folder
3. **Backend uploads to Cloudinary** and gets secure URL
4. **Backend deletes local file** to save space
5. **Backend returns image URL** to frontend
6. **Frontend uses URL** when creating projects

## Frontend Integration

### Upload Image

```javascript
// 1. Upload image
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const uploadRes = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const { imageUrl } = await uploadRes.json();
```

### Create Project

```javascript
// 2. Create project with image URL
const projectData = {
  image: imageUrl,
  title: "Project Title",
  shortDescription: "Brief description",
  longDescription: "Detailed description",
  technologies: ["Node.js", "React"],
  demoLink: "https://demo-link.com"
};

await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(projectData)
});
```

## Data Models

### Project
```javascript
{
  image: String,           // Cloudinary URL
  title: String,           // Required
  shortDescription: String, // Required
  longDescription: String, // Required
  technologies: [String],  // Required
  demoLink: String,        // Required
  createdAt: Date
}
```

### Review
```javascript
{
  name: String,     // Required
  email: String,    // Required, unique
  comment: String,  // Required
  rating: Number,   // Required, 1-5
  createdAt: Date
}
```

## Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

- Rate limiting (5 requests per minute per IP)
- Input validation and sanitization
- File type and size restrictions
- Security headers (Helmet)
- CORS configuration
- Environment variable protection

## Development

- Uses `nodemon` for auto-restart during development
- MongoDB connection with error handling
- Comprehensive error middleware
- Clean MVC architecture for maintainability

## Deployment

1. Set environment variables in your hosting platform
2. Ensure MongoDB Atlas IP whitelist includes your server
3. Configure Cloudinary settings
4. Run `npm start` for production

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Update documentation for new features
4. Test API endpoints thoroughly