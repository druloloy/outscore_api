const mongoose = require('mongoose');
const tokenConfig = require('../token.config');
const StudentSessionSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    studentId: {
        type: String,
        required: true,
    },
    session: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        default: new Date(Date.now() + tokenConfig.REFRESH.MAX_AGE),
        index: { expires: tokenConfig.REFRESH.MAX_AGE }
    }
},
{
    _id: false,
    id: false,
    timestamps: true
});

module.exports = mongoose.model('StudentSession', StudentSessionSchema);