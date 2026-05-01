const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    tags: [{
        type: String,
        trim: true,
    }],
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'In Progress', 'Completed', 'On Hold'],
        default: 'Pending',
    },
    image: {
        type: String,
        required: true,
    },
    // Keep existing fields for backward compatibility
    shortDescription: {
        type: String,
        trim: true,
    },
    longDescription: {
        type: String,
        trim: true,
    },
    technologies: [{
        type: String,
        trim: true,
    }],
    demoLink: {
        type: String,
        trim: true,
    },
    project_url: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Project', projectSchema);