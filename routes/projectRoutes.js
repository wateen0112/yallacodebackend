const express = require('express');
const router = express.Router();

const {
    getProjects,
    getProject,
    createProject
} = require('../controllers/projectController');

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
 *         description: Search term for title or technologies
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
 *     description: Retrieve a specific project by ID
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
 *     description: Create a new project with image and details
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Project'
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
router.post('/', createProject);

module.exports = router;