const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({ 
    name: {
        type: String,
        required: true,
        unique: true
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Subject', SubjectSchema);