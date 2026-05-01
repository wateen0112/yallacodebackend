const express = require('express');
const router = express.Router();

const {
    getProjects,
    getProject,
    getProjectById,
    createProject,
    deleteProject
} = require('../controllers/projectController');
const upload = require('../middlewares/uploadMiddleware');

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     description: Retrieve a paginated list of projects with optional search and sorting
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of projects per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term (title, slug, description, tags, technologies)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: '-createdAt'
 *         description: Sort field (e.g., '-createdAt', 'title')
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectsResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get single project
 *     description: Retrieve a project by MongoDB id (24-char hex) or by slug
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId or project slug
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found
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
router.get('/:id', getProject);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create new project
 *     description: Create a new project with image and details using multipart form data
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: ['slug', 'title', 'description', 'status', 'image']
 *             properties:
 *               slug:
 *                 type: string
 *                 description: Unique URL-friendly identifier for the project
 *               title:
 *                 type: string
 *                 description: Project title
 *               description:
 *                 type: string
 *                 description: Project description
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags
 *               status:
 *                 type: string
 *                 enum: [Pending, 'In Progress', Completed, 'On Hold']
 *                 default: Pending
 *                 description: Current status of the project
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Project image file
 *               project_url:
 *                 type: string
 *                 description: Optional URL to the live project or demo
 *               shortDescription:
 *                 type: string
 *                 description: Brief project description
 *               longDescription:
 *                 type: string
 *                 description: Detailed project description
 *               technologies:
 *                 type: string
 *                 description: Comma-separated list of technologies
 *               demoLink:
 *                 type: string
 *                 description: Link to project demo
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
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
router.post('/', upload.single('image'), createProject);

/**
 * @swagger
 * /api/projects/test:
 *   post:
 *     summary: Test form data parsing
 *     description: Test endpoint to debug multipart form data parsing
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               slug:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Form data received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     body:
 *                       type: object
 *                     file:
 *                       type: object
 */
router.post('/test', upload.single('image'), (req, res) => {
    console.log('TEST ENDPOINT - Raw request headers:', req.headers);
    console.log('TEST ENDPOINT - Content-Type:', req.get('Content-Type'));
    console.log('TEST ENDPOINT - Request body:', req.body);
    console.log('TEST ENDPOINT - Request file:', req.file);
    console.log('TEST ENDPOINT - Body keys:', Object.keys(req.body));
    console.log('TEST ENDPOINT - Description:', req.body.description);
    console.log('TEST ENDPOINT - Title:', req.body.title);
    console.log('TEST ENDPOINT - Slug:', req.body.slug);
    
    res.json({
        success: true,
        data: {
            message: 'Form data received',
            body: req.body,
            file: req.file ? {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            } : null,
            bodyKeys: Object.keys(req.body),
            description: req.body.description,
            title: req.body.title,
            slug: req.body.slug
        }
    });
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a specific project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Project not found
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
router.delete('/:id', deleteProject);

module.exports = router;