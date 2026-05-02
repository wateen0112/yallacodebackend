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
const projectUrlFromBody = (body) =>
    firstFormString(body, [
        'project_url',
        'projectUrl',
        'projectURL',
        'project-url',
    ]);

/** Single project payload for GET-by-id and related responses (includes project_url + projectUrl). */
const toProjectResponse = (doc) => {
    const o = doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const rawUrl = o.project_url;
    const projectUrlValue =
        rawUrl === undefined || rawUrl === null ? '' : String(rawUrl).trim();

    return {
        id: o._id,
        slug: o.slug || '',
        title: o.title || '',
        description: o.description || '',
        tags: o.tags || [],
        status: o.status || 'Pending',
        image: o.image || '',
        coverImage: o.coverImage || '',
        project_url: projectUrlValue,
        projectUrl: projectUrlValue,
        shortDescription: o.shortDescription || '',
        longDescription: o.longDescription || '',
        technologies: o.technologies || [],
        demoLink: o.demoLink || '',
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
    };
};

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

        const normalizedProjects = projects.map((p) => toProjectResponse(p));

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

        res.status(200).json({
            success: true,
            data: toProjectResponse(project)
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
        console.log('=== CREATE PROJECT FUNCTION CALLED ===');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        console.log('Request method:', req.method);
        console.log('Request URL:', req.originalUrl);
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

        const shortDescription =
            req.body.shortDescription != null ? String(req.body.shortDescription).trim() : '';
        const longDescription =
            req.body.longDescription != null ? String(req.body.longDescription).trim() : '';

        // Same lookup as multipart aliases (project_url, projectUrl, …) — not only req.body.project_url
        const project_url = projectUrlFromBody(req.body);
        if (project_url.length > 2048) {
            return res.status(400).json({
                success: false,
                message: 'project_url is too long (max 2048 characters)'
            });
        }

        const allowedStatus = ['Pending', 'In Progress', 'Completed', 'On Hold'];
        let status = req.body.status != null ? String(req.body.status).trim() : 'Pending';
        if (!allowedStatus.includes(status)) {
            status = 'Pending';
        }

        const projectData = {
            slug,
            title,
            description,
            tags,
            status,
            image: imageUrl,
            shortDescription,
            longDescription,
            technologies,
            demoLink: firstFormString(req.body, ['demoLink', 'demo_link']),
            project_url,
        };

        const project = await Project.create(projectData);

        res.status(201).json({
            success: true,
            data: toProjectResponse(project),
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
            data: toProjectResponse(project)
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