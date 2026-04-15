const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    shortDescription: {
        type: String,
        required: true,
        trim: true,
    },
    longDescription: {
        type: String,
        required: true,
        trim: true,
    },
    technologies: [{
        type: String,
        required: true,
    }],
    demoLink: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Project', projectSchema);