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
    expires: {
        type: Date,
        index: { expires: tokenConfig.REFRESH.EXPIRES_IN },
    }
},
{
    _id: false,
    id: false,
    timestamps: false
});

module.exports = mongoose.model('StudentSession', StudentSessionSchema);