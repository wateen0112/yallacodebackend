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

        console.log('Project found:', project);
        console.log('Project project_url:', project.project_url);
        console.log('Project object keys:', Object.keys(project.toObject()));

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

        let imageUrl = '';

        // Handle image upload if present
        if (req.file) {
            console.log('File uploaded successfully:', req.file);
            console.log('File path:', req.file.path);
            
            // Add a small delay to ensure file is fully written
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if file exists before uploading to Cloudinary
            const fs = require('fs');
            if (!fs.existsSync(req.file.path)) {
                console.error('File not found at path:', req.file.path);
                return res.status(500).json({
                    success: false,
                    message: 'Uploaded file not found on server'
                });
            }
            
            // Check file size to ensure it's not empty
            const stats = fs.statSync(req.file.path);
            console.log('File size:', stats.size, 'bytes');
            if (stats.size === 0) {
                console.error('File is empty:', req.file.path);
                return res.status(500).json({
                    success: false,
                    message: 'Uploaded file is empty'
                });
            }
            
            imageUrl = await uploadToCloudinary(req.file.path);
            console.log('Cloudinary upload successful, URL:', imageUrl);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

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
            project_url: req.body.projectUrl || req.body.project_url,
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
        console.log('Project URL in projectData:', projectData.project_url);
        console.log('req.body.projectUrl:', req.body.projectUrl);
        console.log('req.body.project_url:', req.body.project_url);

        const project = await Project.create(projectData);
        console.log('Project created successfully:', project);
        console.log('Created project project_url:', project.project_url);

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