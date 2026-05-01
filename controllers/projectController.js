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
        console.log('=== CREATE PROJECT START ===');
        console.log('Request body received:', req.body);
        console.log('Request body keys:', Object.keys(req.body));
        console.log('File received:', req.file);
        console.log('Description field specifically:', req.body.description);
        console.log('Title field specifically:', req.body.title);
        console.log('Slug field specifically:', req.body.slug);

        // TEMPORARY: Skip Cloudinary for debugging - use placeholder URL
        let imageUrl = 'https://via.placeholder.com/300x200.png?text=Debug+Image';
        
        console.log('Using placeholder image URL for debugging');

        // Parse tags if sent as string
        let tags = req.body.tags;
        if (typeof tags === 'string') {
            tags = tags.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0); // Remove empty tags from trailing comma
        }

        // Create project with form data
        const projectData = {
            slug: req.body.slug,
            title: req.body.title,
            description: req.body.description,
            tags: tags,
            status: req.body.status || 'Pending',
            image: imageUrl,
            project_url: req.body.project_url,
            // Optional legacy fields for backward compatibility
            shortDescription: req.body.shortDescription,
            longDescription: req.body.longDescription,
            technologies: req.body.technologies ? (typeof req.body.technologies === 'string' ? req.body.technologies.split(',').map(tech => tech.trim()) : req.body.technologies) : [],
            demoLink: req.body.demoLink
        };

        console.log('Project data to be created:', projectData);
        console.log('Description in projectData:', projectData.description);
        console.log('Title in projectData:', projectData.title);
        console.log('Slug in projectData:', projectData.slug);

        const project = await Project.create(projectData);
        console.log('Project created successfully:', project);

        res.status(201).json({
            success: true,
            data: project,
            message: 'Project created successfully (debug mode)'
        });
    } catch (error) {
        console.error('=== CREATE PROJECT ERROR ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error name:', error.name);
        
        // Handle duplicate slug error
        if (error.code === 11000 && error.keyPattern?.slug) {
            return res.status(400).json({
                success: false,
                message: 'Slug already exists. Please use a unique slug.'
            });
        }
        next(error);
    }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res, next) => {
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
    getProjectById,
    createProject,
    deleteProject
};