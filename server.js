const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const os = require('os');

// Load environment variables
dotenv.config();

// Import swagger
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import configs
const connectDB = require('./config/db');
const { cloudinaryConfig } = require('./config/cloudinary');

// Import routes
const projectRoutes = require('./routes/projectRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Import middlewares
const errorMiddleware = require('./middlewares/errorMiddleware');
const apiSecretMiddleware = require('./middlewares/apiSecretMiddleware');

const app = express();
const METHODS_REQUIRING_SECRET = new Set(['POST', 'PUT', 'DELETE']);

const LOG_GREEN = '\x1b[32m';
const LOG_RESET = '\x1b[0m';

const logInfo = (label, value) => {
    console.log(`${LOG_GREEN}[INFO]${LOG_RESET} ${label}: ${value}`);
};

const getLocalIPs = () => {
    const nets = os.networkInterfaces();
    const ips = [];

    Object.keys(nets).forEach((name) => {
        nets[name].forEach((net) => {
            if (net.family === 'IPv4' && !net.internal) {
                ips.push(net.address);
            }
        });
    });

    return ips.length ? ips : ['127.0.0.1'];
};

// Swagger definition
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'YallaCode Backend API',
        version: '1.0.0',
        description: 'API documentation for YallaCode software company website backend',
    },
    servers: [
        {
            url: `http://localhost:${process.env.PORT || 5000}`,
            description: 'Development server',
        },
    ],
    components: {
        schemas: {
            Project: {
                type: 'object',
                required: ['image', 'title', 'shortDescription', 'longDescription', 'technologies', 'demoLink'],
                properties: {
                    image: {
                        type: 'string',
                        description: 'Cloudinary URL of the project image',
                    },
                    title: {
                        type: 'string',
                        description: 'Project title',
                    },
                    shortDescription: {
                        type: 'string',
                        description: 'Brief project description',
                    },
                    longDescription: {
                        type: 'string',
                        description: 'Detailed project description',
                    },
                    technologies: {
                        type: 'array',
                        items: {
                            type: 'string',
                        },
                        description: 'List of technologies used',
                    },
                    demoLink: {
                        type: 'string',
                        description: 'Link to project demo',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Creation timestamp',
                    },
                },
            },
            Review: {
                type: 'object',
                required: ['name', 'email', 'comment', 'rating'],
                properties: {
                    name: {
                        type: 'string',
                        description: 'Reviewer name',
                    },
                    email: {
                        type: 'string',
                        format: 'email',
                        description: 'Reviewer email (unique)',
                    },
                    comment: {
                        type: 'string',
                        description: 'Review comment',
                    },
                    rating: {
                        type: 'number',
                        minimum: 1,
                        maximum: 5,
                        description: 'Rating from 1 to 5',
                    },
                    createdAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Creation timestamp',
                    },
                },
            },
            UploadResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true,
                    },
                    data: {
                        type: 'object',
                        properties: {
                            imageUrl: {
                                type: 'string',
                                description: 'Cloudinary secure URL',
                                example: 'https://cloudinary-url.jpg',
                            },
                        },
                    },
                },
            },
            ApiResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                    },
                    data: {
                        type: 'object',
                    },
                    message: {
                        type: 'string',
                    },
                },
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: false,
                    },
                    message: {
                        type: 'string',
                        description: 'Error message',
                    },
                },
            },
            ProjectsResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true,
                    },
                    data: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/Project',
                        },
                    },
                    pagination: {
                        type: 'object',
                        properties: {
                            currentPage: {
                                type: 'number',
                            },
                            totalPages: {
                                type: 'number',
                            },
                            totalProjects: {
                                type: 'number',
                            },
                            hasNext: {
                                type: 'boolean',
                            },
                            hasPrev: {
                                type: 'boolean',
                            },
                        },
                    },
                },
            },
            ReviewsStats: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        example: true,
                    },
                    data: {
                        type: 'object',
                        properties: {
                            totalReviews: {
                                type: 'number',
                            },
                            averageRating: {
                                type: 'number',
                            },
                            ratingDistribution: {
                                type: 'object',
                                properties: {
                                    1: { type: 'number' },
                                    2: { type: 'number' },
                                    3: { type: 'number' },
                                    4: { type: 'number' },
                                    5: { type: 'number' },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

const options = {
    swaggerDefinition,
    apis: ['./routes/*.js', './server.js'], // Paths to files containing OpenAPI definitions
};

const specs = swaggerJSDoc(options);

// Connect to MongoDB
connectDB();

// Cloudinary config
cloudinaryConfig();

// Rate limiting: 5 requests per minute per IP
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});

const logRequest = (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',').shift() || req.socket.remoteAddress;
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log(`${LOG_GREEN}[API]${LOG_RESET} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - IP: ${ip}`);
    });

    next();
};

const apiSecretForWriteMethods = (req, res, next) => {
    if (METHODS_REQUIRING_SECRET.has(req.method)) {
        return apiSecretMiddleware(req, res, next);
    }

    next();
};

// Middlewares
app.use(helmet());
app.use(cors());
//app.use(limiter);
app.use(logRequest);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/projects', apiSecretForWriteMethods, projectRoutes);
app.use('/api/reviews', apiSecretForWriteMethods, reviewRoutes);
app.use('/api/upload', apiSecretForWriteMethods, uploadRoutes);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     description: Check if the server is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Server is running"
 */
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    const ips = getLocalIPs();

    logInfo('Server running', `http://localhost:${PORT}`);
    logInfo('API docs', `http://localhost:${PORT}/api-docs`);
    logInfo('MongoDB host', mongoose.connection.host || 'unknown');
    logInfo('Network IPs', ips.join(', '));
    logInfo('Environment', process.env.NODE_ENV || 'development');
});