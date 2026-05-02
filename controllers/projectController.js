const Project = require('../models/Project');
const uploadToCloudinary = require('../utils/uploadToCloudinary');

/** 24-hex MongoDB ObjectId string */
const isMongoObjectId = (s) => typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s);

const splitCommaList = (value) => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) {
        return value.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
};

/**
 * Read first matching form field (multipart or JSON).
 * Handles duplicate fields (array), Buffer segments, and common aliases.
 */
const firstFormString = (body, keys) => {
    for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
        let v = body[key];
        if (Array.isArray(v)) {
            v = v.find((x) => x !== undefined && x !== null && x !== '');
        }
        if (v === undefined || v === null) return '';
        if (Buffer.isBuffer(v)) return v.toString('utf8').trim();
        return String(v).trim();
    }
    return '';
};

/** Maps multipart name="project_url" (and aliases) to stored schema field project_url. */
const project_urlFromBody = (body) =>
    firstFormString(body, [
        'project_url',
        'project_url',
        'project_url',
        'project-url',
    ]);

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

        // Search title, slug, description, tags, technologies (escape regex special chars)
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { title: { $regex: escaped, $options: 'i' } },
                { slug: { $regex: escaped, $options: 'i' } },
                { description: { $regex: escaped, $options: 'i' } },
                { tags: { $regex: escaped, $options: 'i' } },
                { technologies: { $regex: escaped, $options: 'i' } },
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

        // Ensure all projects have empty data for non-provided attributes
        const normalizedProjects = projects.map(project => {
            const projectObj = project.toObject();
            return {
                id: projectObj._id,
                slug: projectObj.slug || '',
                title: projectObj.title || '',
                description: projectObj.description || '',
                tags: projectObj.tags || [],
                status: projectObj.status || 'Pending',
                image: projectObj.image || '',
                coverImage: projectObj.coverImage || '',
                project_url: projectObj.project_url || '',
                shortDescription: projectObj.shortDescription || '',
                longDescription: projectObj.longDescription || '',
                technologies: projectObj.technologies || [],
                demoLink: projectObj.demoLink || '',
                createdAt: projectObj.createdAt,
                updatedAt: projectObj.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            data: normalizedProjects,
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

// @desc    Get single project by MongoDB id or slug
// @route   GET /api/projects/:id
// @access  Public
const getProject = async (req, res, next) => {
    try {
        const param = req.params.id;
        let project;

        if (isMongoObjectId(param)) {
            project = await Project.findById(param);
        }
        if (!project) {
            project = await Project.findOne({
                slug: String(param).toLowerCase().trim(),
            });
        }

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }

        // Ensure project has empty data for non-provided attributes
        const projectObj = project.toObject();
        const normalizedProject = {
            id: projectObj._id,
            slug: projectObj.slug || '',
            title: projectObj.title || '',
            description: projectObj.description || '',
            tags: projectObj.tags || [],
            status: projectObj.status || 'Pending',
            image: projectObj.image || '',
            coverImage: projectObj.coverImage || '',
            project_url: projectObj.project_url || '',
            shortDescription: projectObj.shortDescription || '',
            longDescription: projectObj.longDescription || '',
            technologies: projectObj.technologies || [],
            demoLink: projectObj.demoLink || '',
            createdAt: projectObj.createdAt,
            updatedAt: projectObj.updatedAt
        };

        res.status(200).json({
            success: true,
            data: normalizedProject
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

        const imageFile =
            req.file ||
            (req.files && req.files.image && req.files.image[0]) ||
            null;

        // Handle image upload if present
        if (imageFile) {
            // Brief delay so disk write completes (Windows / slow FS)
            await new Promise((resolve) => setTimeout(resolve, 100));

            const fs = require('fs');
            if (!fs.existsSync(imageFile.path)) {
                return res.status(500).json({
                    success: false,
                    message: 'Uploaded file not found on server'
                });
            }

            const stats = fs.statSync(imageFile.path);
            if (stats.size === 0) {
                return res.status(500).json({
                    success: false,
                    message: 'Uploaded file is empty'
                });
            }

            imageUrl = await uploadToCloudinary(imageFile.path);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        const tags = splitCommaList(req.body.tags);
        const technologies = splitCommaList(req.body.technologies);
        const project_url = req.body.project_url != null ? String(req.body.project_url).trim() : '';
        if (!project_url) {
            return res.status(400).json({
                success: false,
                message: 'project_url is required'
            });
        }
        
        if (!project_url.startsWith('https://')) {
            return res.status(400).json({
                success: false,
                message: 'project_url must start with https://'
            });
        }
        
        if (!project_url.endsWith('/')) {
            return res.status(400).json({
                success: false,
                message: 'project_url must end with /'
            });
        }
        
        if (project_url.length > 200) {
            return res.status(400).json({
                success: false,
                message: 'project_url must be less than 200 characters'
            });
        }
        
        if (project_url.includes(' ')) {
            return res.status(400).json({
                success: false,
                message: 'project_url must not contain spaces'
            });
        }
        
        if (project_url.includes('.')) {
            return res.status(400).json({
                success: false,
                message: 'project_url must not contain .'
            });
        }
        
        if (project_url.includes('@')) {
            return res.status(400).json({
                success: false,
                message: 'project_url must not contain @'
            });
        }
        
        if (project_url.includes('#')) {
            return res.status(400).json({
                success: false,
                message: 'project_url must not contain #'
            });
        }

        const slug = req.body.slug != null ? String(req.body.slug).trim() : '';
        const title = req.body.title != null ? String(req.body.title).trim() : '';
        const description =
            req.body.description != null ? String(req.body.description).trim() : '';

        if (!slug || !title || !description) {
            return res.status(400).json({
                success: false,
                message: 'slug, title, and description are required'
            });
        }

        const allowedStatus = ['Pending', 'In Progress', 'Completed', 'On Hold'];
        let status = req.body.status != null ? String(req.body.status).trim() : 'Pending';
        if (!allowedStatus.includes(status)) {
            status = 'Pending';
        }

        // Create project with form data (multipart field names match client)
        const projectData = {
            slug,
            title,
            shortDescription,
            longDescription,
            description,
            tags,
            status,
            image: imageUrl,
            shortDescription:
                req.body.shortDescription != null
                    ? String(req.body.shortDescription).trim()
                    : '',
            longDescription:
                req.body.longDescription != null
                    ? String(req.body.longDescription).trim()
                    : '',
                    project_url,

            technologies,
            demoLink: firstFormString(req.body, ['demoLink', 'demo_link']),
            project_url: project_urlFromBody(req.body),
        };

        const project = await Project.create(projectData);

        // Ensure project has empty data for non-provided attributes in response
        const projectObj = project.toObject();
        const normalizedProject = {
            id: projectObj._id,
            project_url,
            slug: projectObj.slug || '',
            title: projectObj.title || '',
            description: projectObj.description || '',
            tags: projectObj.tags || [],
            status: projectObj.status || 'Pending',
            image: projectObj.image || '',
            coverImage: projectObj.coverImage || '',
            project_url: projectObj.project_url || '',
            shortDescription: projectObj.shortDescription || '',
            longDescription: projectObj.longDescription || '',
            technologies: projectObj.technologies || [],
            demoLink: projectObj.demoLink || '',
            createdAt: projectObj.createdAt,
            updatedAt: projectObj.updatedAt
        };

        res.status(201).json({
            success: true,
            data: normalizedProject,
            message: 'Project created successfully'
        });
    } catch (error) {
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