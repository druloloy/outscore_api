const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
    id:{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    os: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
},{
    _id: false
});

module.exports = RefreshTokenSchema;