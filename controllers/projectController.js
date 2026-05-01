const Project = require('../models/Project');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const sort = req.query.sort || '-createdAt'; // Default sort by newest

        const query = {};

        // Search in title or technologies
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { technologies: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const options = {
            page,
            limit,
            sort,
            select: '-__v'
        };

        const projects = await Project.find(query)
            .sort(options.sort)
            .limit(options.limit * 1)
            .skip((options.page - 1) * options.limit)
            .exec();

        const total = await Project.countDocuments(query);

        res.status(200).json({
            success: true,
            data: projects,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalProjects: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Public (in production, might need auth)
const createProject = async (req, res, next) => {
    try {
        let imageUrl = '';

        // Handle image upload if present
        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file.path);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        // Parse technologies if sent as string
        let technologies = req.body.technologies;
        if (typeof technologies === 'string') {
            technologies = technologies.split(',').map(tech => tech.trim());
        }

        // Create project with image URL
        const projectData = {
            image: imageUrl,
            title: req.body.title,
            shortDescription: req.body.shortDescription,
            longDescription: req.body.longDescription,
            technologies: technologies,
            demoLink: req.body.demoLink
        };

        const project = await Project.create(projectData);

        res.status(201).json({
            success: true,
            data: project,
            message: 'Project created successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Public (in production, might need auth)
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        await Project.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjects,
    getProject,
    createProject,
    deleteProject
};